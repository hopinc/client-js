import type {API} from '@onehop/js';
import {
	LeapEdgeAuthenticationParameters,
	LeapEdgeClient,
	LeapConnectionState,
} from '@onehop/leap-edge-js';
import {createContext, Dispatch, SetStateAction, useContext} from 'react';
import {ObservableMap, useObservableMap} from '../util/maps';
import {resolveSetStateAction} from '../util/state';

import {AVAILABLE} from '../leap/handlers/AVAILABLE';
import {INIT} from '../leap/handlers/INIT';
import {UNAVAILABLE} from '../leap/handlers/UNAVAILABLE';

type LeapClientError = 'UNAUTHORIZED';

// TODO: Export this from @onehop/leap-edge-js
type LeapServiceEvent = LeapEdgeClient['on'] extends (
	event: 'serviceEvent',
	listener: (data: infer R) => any,
) => any
	? R
	: never;

type EncapsulationServicePayload = Parameters<
	LeapEdgeClient['sendServicePayload']
>[0];

export type ClientStateData<T extends API.Channels.State> = {
	error: LeapClientError | null;
	state: T | null;
	subscription: 'available' | 'pending' | 'rejected';
};

export class ClientContext {
	public static readonly SUPPORTED_OPCODES = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
	};

	private static leap: LeapEdgeClient | null = null;

	private readonly channelStateMap = new ObservableMap<
		API.Channels.Channel['id'],
		ClientStateData<API.Channels.State>
	>();

	connect(auth: LeapEdgeAuthenticationParameters) {
		if (ClientContext.leap) {
			throw new Error('Cannot connect multiple times!');
		}

		const controller = new AbortController();

		const timeout = setTimeout(() => {
			controller.abort();
		}, 10_000);

		return new Promise<void>((resolve, reject) => {
			const leap = this.getLeap(auth);

			const resolver = (state: LeapConnectionState) => {
				if (state === LeapConnectionState.CONNECTED) {
					resolve();
					clearTimeout(timeout);
					leap.off('connectionStateUpdate', resolver);
					return;
				}
			};

			controller.signal.addEventListener('abort', () => {
				leap.off('connectionStateUpdate', resolver);
				reject();
			});

			leap.on('connectionStateUpdate', resolver);
			leap.on('serviceEvent', message => this.handleServiceMessage(message));

			this.getLeap().connect();
		});
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
			await handler.handle(
				this,
				message.channelId as API.Channels.Channel['id'] | null,
				message.data as any,
			);
		} catch (error) {
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

	send(data: EncapsulationServicePayload) {
		this.getLeap().sendServicePayload(data);
	}

	private getLeap(auth?: LeapEdgeAuthenticationParameters) {
		if (ClientContext.leap) {
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

		state.set(channel, {
			error: oldState.error,
			subscription: oldState?.subscription,
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
