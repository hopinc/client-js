import {API} from '@onehop/js';
import {
	LeapEdgeAuthenticationParameters,
	LeapEdgeClient,
	LeapConnectionState,
	LeapServiceEvent,
	EncapsulatingServicePayload,
} from '@onehop/leap-edge-js';
import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useEffect,
} from 'react';
import {ObservableMap, useObservableMap} from '../util/maps';
import {resolveSetStateAction} from '../util/state';
import {atom, useAtom} from '../util/atom';

import {AVAILABLE} from '../leap/handlers/AVAILABLE';
import {INIT} from '../leap/handlers/INIT';
import {UNAVAILABLE} from '../leap/handlers/UNAVAILABLE';
import {STATE_UPDATE} from '../leap/handlers/STATE_UPDATE';
import {
	ChannelMessageListenerKey,
	getMessageListenerKey,
	MESSAGE,
} from '../leap/handlers/MESSAGE';

export type LeapChannelSubscriptionError = 'NOT_GRANTED' | 'UNKNOWN';

export type ClientStateData<T extends API.Channels.State> = {
	state: T | null;
	subscription: 'available' | 'pending' | 'unavailable';
	error: LeapChannelSubscriptionError | null;
};

export class ClientContext {
	public static readonly SUPPORTED_OPCODES = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
		STATE_UPDATE,
		MESSAGE,

		// Deprecated
		EVENT: MESSAGE,
	};

	public static readonly CONNECTION_STATE = atom<LeapConnectionState | null>(
		null,
	);

	private static leap: LeapEdgeClient | null = null;

	private readonly channelStateMap = new ObservableMap<
		API.Channels.Channel['id'],
		ClientStateData<API.Channels.State>
	>();

	private readonly channelMessageListeners = new Map<
		ChannelMessageListenerKey,
		Set<(data: unknown) => unknown>
	>();

	connect(auth: LeapEdgeAuthenticationParameters) {
		if (ClientContext.leap) {
			return;
		}

		const leap = this.getLeap(auth);

		const serviceEvent = async (message: LeapServiceEvent) => {
			await this.handleServiceMessage(message);
		};

		const connectionStateUpdate = (state: LeapConnectionState) => {
			ClientContext.CONNECTION_STATE.set(state);
		};

		leap.on('serviceEvent', serviceEvent);
		leap.on('connectionStateUpdate', connectionStateUpdate);

		this.getLeap().connect();
	}

	async handleServiceMessage(message: LeapServiceEvent) {
		const handler =
			ClientContext.SUPPORTED_OPCODES[
				message.eventType as keyof typeof ClientContext.SUPPORTED_OPCODES
			];

		if (!handler) {
			console.warn(
				'[@onehop/react] Leap: Received unsupported opcode!',
				message,
			);

			return;
		}

		try {
			await handler.handle(this, message.channelId, message.data as any);
		} catch (error: unknown) {
			console.warn('[@onehop/react] Handling service message failed');
			console.warn(error);
		}
	}

	useChannelState(channel: API.Channels.Channel['id']) {
		return useObservableMap(this.channelStateMap).get(channel);
	}

	getChannelStateMap() {
		return this.channelStateMap;
	}

	getMessageListeners() {
		return this.channelMessageListeners;
	}

	subscribeToChannel(channel: API.Channels.Channel['id']) {
		this.getLeap().sendServicePayload({
			e: 'SUBSCRIBE',
			d: null,
			c: channel,
		});
	}

	unsubscribeFromChannel(channel: API.Channels.Channel['id']) {
		this.getLeap().sendServicePayload({
			e: 'UNSUBSCRIBE',
			d: null,
			c: channel,
		});
	}

	send(data: EncapsulatingServicePayload) {
		this.getLeap().sendServicePayload(data);
	}

	private getLeap(auth?: LeapEdgeAuthenticationParameters) {
		if (ClientContext.leap) {
			if (auth) {
				ClientContext.leap.auth = auth;
			}

			return ClientContext.leap;
		}

		if (!auth) {
			throw new Error(
				'Cannot create a new Leap instance as no authentication params were provided',
			);
		}

		ClientContext.leap = new LeapEdgeClient(auth);
		ClientContext.leap.connect();

		return ClientContext.leap;
	}
}

export const clientContext = createContext(new ClientContext());

export function useClientContext(): ClientContext {
	return useContext(clientContext);
}

export function useChannelMessage<T = any>(
	channel: API.Channels.Channel['id'],
	event: string,
	listener: (data: T) => unknown,
) {
	const client = useClientContext();
	const map = client.getMessageListeners();

	useEffect(() => {
		const key = getMessageListenerKey(channel, event);
		const listeners = map.get(key) ?? new Set();

		const castListener = listener as (data: unknown) => unknown;

		map.set(key, listeners.add(castListener));

		return () => {
			const currentListeners = map.get(key);

			if (!currentListeners) {
				return;
			}

			currentListeners.delete(castListener);

			if (currentListeners.size === 0) {
				map.delete(key);
			}
		};
	}, []);
}

export function useClientConnectionState() {
	return useAtom(ClientContext.CONNECTION_STATE);
}

export function useReadChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): ClientStateData<T> {
	const client = useClientContext();

	const data = client.useChannelState(channel) as
		| ClientStateData<T>
		| undefined;

	if (!data) {
		client.subscribeToChannel(channel);

		const state: ClientStateData<T> = {
			state: null,
			error: null,
			subscription: 'pending',
		};

		client.getChannelStateMap().set(channel, state);

		return state;
	}

	return data;
}

export function useSetChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): Dispatch<SetStateAction<T>> {
	const client = useClientContext();
	const state = useObservableMap(client.getChannelStateMap());
	const oldState = client.useChannelState(channel);

	return value => {
		if (!oldState) {
			return;
		}

		const newState = resolveSetStateAction<T>(oldState.state as T, value);

		client.send({
			e: 'SET_CHANNEL_STATE',
			c: channel,
			d: newState,
		});

		state.patch(channel, {
			state: newState,
		});
	};
}

export function useChannelState<
	T extends API.Channels.State = API.Channels.State,
>(
	channel: API.Channels.Channel['id'],
): [data: ClientStateData<T>, setState: Dispatch<SetStateAction<T>>] {
	const state = useReadChannelState<T>(channel);
	const setState = useSetChannelState<T>(channel);

	return [state, setState];
}
