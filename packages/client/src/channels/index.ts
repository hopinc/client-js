import {API} from '@onehop/js';
import {
	LeapConnectionState,
	LeapEdgeClient,
	LeapEdgeAuthenticationParameters,
	LeapServiceEvent,
	EncapsulatingServicePayload,
} from '@onehop/leap-edge-js';

import {atoms, maps, channels} from '../util';
import {AVAILABLE} from './handlers/AVAILABLE';
import {INIT} from './handlers/INIT';
import {MESSAGE} from './handlers/MESSAGE';
import {STATE_UPDATE} from './handlers/STATE_UPDATE';
import {UNAVAILABLE} from './handlers/UNAVAILABLE';

export type LeapChannelSubscriptionError = 'NOT_GRANTED' | 'UNKNOWN';

export type ClientStateData<T extends API.Channels.State> = {
	state: T | null;
	subscription: 'available' | 'pending' | 'unavailable';
	error: LeapChannelSubscriptionError | null;
};

export class ChannelsClient {
	public static readonly SUPPORTED_EVENTS = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
		STATE_UPDATE,
		MESSAGE,
	};

	private readonly connectionState = atoms.create<LeapConnectionState | null>(
		null,
	);

	private leap: LeapEdgeClient | null = null;

	private readonly channelStateMap = new maps.ObservableMap<
		API.Channels.Channel['id'],
		ClientStateData<API.Channels.State>
	>();

	private readonly channelMessageListeners = new Map<
		channels.ChannelMessageListenerKey,
		Set<(data: unknown) => unknown>
	>();

	connect(auth: LeapEdgeAuthenticationParameters) {
		if (this.leap) {
			return;
		}

		const leap = this.getLeap(auth);

		const serviceEvent = async (message: LeapServiceEvent) => {
			await this.handleServiceMessage(message);
		};

		const connectionStateUpdate = (state: LeapConnectionState) => {
			this.connectionState.set(state);
		};

		leap.on('serviceEvent', serviceEvent);
		leap.on('connectionStateUpdate', connectionStateUpdate);

		this.getLeap().connect();
	}

	getChannelStateMap() {
		return this.channelStateMap;
	}

	getMessageListeners() {
		return this.channelMessageListeners;
	}

	getConnectionState(
		fullAtom?: false,
	): atoms.Infer<typeof this.connectionState>;
	getConnectionState(fullAtom: true): typeof this.connectionState;
	getConnectionState(fullAtom = false) {
		if (fullAtom) {
			return this.connectionState;
		}

		return this.connectionState.get();
	}

	subscribeToChannel(channel: API.Channels.Channel['id']) {
		this.send({
			e: 'SUBSCRIBE',
			d: null,
			c: channel,
		});
	}

	unsubscribeFromChannel(channel: API.Channels.Channel['id']) {
		this.send({
			e: 'UNSUBSCRIBE',
			d: null,
			c: channel,
		});
	}

	setChannelState(
		channel: API.Channels.Channel['id'],
		state: API.Channels.State,
	) {
		this.send({
			e: 'SET_CHANNEL_STATE',
			c: channel,
			d: state,
		});
	}

	sendMessage(
		channel: API.Channels.Channel['id'],
		event: string,
		payload: unknown,
	) {
		this.send({
			e: 'MESSAGE',
			c: channel,
			d: {
				e: event,
				d: payload,
			},
		});
	}

	private async handleServiceMessage(message: LeapServiceEvent) {
		const handler =
			ChannelsClient.SUPPORTED_EVENTS[
				message.eventType as keyof typeof ChannelsClient.SUPPORTED_EVENTS
			];

		if (!handler) {
			console.warn(
				'[@onehop/client] Channels: Received unsupported opcode!',
				message,
			);

			return;
		}

		try {
			await handler.handle(this, message.channelId, message.data as any);
		} catch (error: unknown) {
			console.warn('[@onehop/client] Handling service message failed');
			console.warn(error);
		}
	}

	private send(data: EncapsulatingServicePayload) {
		this.getLeap().sendServicePayload(data);
	}

	private getLeap(auth?: LeapEdgeAuthenticationParameters) {
		if (this.leap) {
			if (auth) {
				this.leap.auth = auth;
			}

			return this.leap;
		}

		if (!auth) {
			throw new Error(
				'Cannot create a new Leap instance as no authentication params were provided',
			);
		}

		this.leap = new LeapEdgeClient(auth);
		this.leap.connect();

		return this.leap;
	}
}
