import {API} from '@onehop/js';
import {
	LeapConnectionState,
	LeapEdgeClient,
	LeapEdgeAuthenticationParameters,
	LeapServiceEvent,
	EncapsulatingServicePayload,
} from '@onehop/leap-edge-js';

import {atoms, maps} from '../util';
import {AVAILABLE} from './handlers/AVAILABLE';
import {INIT} from './handlers/INIT';
import {MESSAGE, ChannelMessageListenerKey} from './handlers/MESSAGE';
import {STATE_UPDATE} from './handlers/STATE_UPDATE';
import {UNAVAILABLE} from './handlers/UNAVAILABLE';

export type LeapChannelSubscriptionError = 'NOT_GRANTED' | 'UNKNOWN';

export type ClientStateData<T extends API.Channels.State> = {
	state: T | null;
	subscription: 'available' | 'pending' | 'unavailable';
	error: LeapChannelSubscriptionError | null;
};

export class ChannelClient {
	public static readonly SUPPORTED_OPCODES = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
		STATE_UPDATE,
		MESSAGE,
	};

	public static readonly CONNECTION_STATE =
		atoms.create<LeapConnectionState | null>(null);

	private static leap: LeapEdgeClient | null = null;

	private readonly channelStateMap = new maps.ObservableMap<
		API.Channels.Channel['id'],
		ClientStateData<API.Channels.State>
	>();

	private readonly channelMessageListeners = new Map<
		ChannelMessageListenerKey,
		Set<(data: unknown) => unknown>
	>();

	connect(auth: LeapEdgeAuthenticationParameters) {
		if (ChannelClient.leap) {
			return;
		}

		const leap = this.getLeap(auth);

		const serviceEvent = async (message: LeapServiceEvent) => {
			await this.handleServiceMessage(message);
		};

		const connectionStateUpdate = (state: LeapConnectionState) => {
			ChannelClient.CONNECTION_STATE.set(state);
		};

		leap.on('serviceEvent', serviceEvent);
		leap.on('connectionStateUpdate', connectionStateUpdate);

		this.getLeap().connect();
	}

	async handleServiceMessage(message: LeapServiceEvent) {
		const handler =
			ChannelClient.SUPPORTED_OPCODES[
				message.eventType as keyof typeof ChannelClient.SUPPORTED_OPCODES
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
		if (ChannelClient.leap) {
			if (auth) {
				ChannelClient.leap.auth = auth;
			}

			return ChannelClient.leap;
		}

		if (!auth) {
			throw new Error(
				'Cannot create a new Leap instance as no authentication params were provided',
			);
		}

		ChannelClient.leap = new LeapEdgeClient(auth);
		ChannelClient.leap.connect();

		return ChannelClient.leap;
	}
}
