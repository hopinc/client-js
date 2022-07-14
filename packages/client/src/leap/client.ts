import {API} from '@onehop/js';

import {
	LeapConnectionState,
	LeapEdgeClient,
	LeapEdgeAuthenticationParameters,
	LeapServiceEvent,
	EncapsulatingServicePayload,
} from '@onehop/leap-edge-js';

import {atoms, maps, channels} from '../util';
import {ChannelStateData, RoomStateData} from './types';

import {LeapHandler} from './handlers/create';
import {AVAILABLE} from './handlers/AVAILABLE';
import {INIT} from './handlers/INIT';
import {MESSAGE} from './handlers/MESSAGE';
import {STATE_UPDATE} from './handlers/STATE_UPDATE';
import {TOKEN_STATE_UPDATE} from './handlers/TOKEN_STATE_UPDATE';
import {UNAVAILABLE} from './handlers/UNAVAILABLE';
import {PIPE_ROOM_AVAILABLE} from './handlers/PIPE_ROOM_AVAILABLE';
import {PIPE_ROOM_UPDATE} from './handlers/PIPE_ROOM_UPDATE';

export class Client {
	public static readonly SUPPORTED_EVENTS: Record<string, LeapHandler> = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
		STATE_UPDATE,
		TOKEN_STATE_UPDATE,
		MESSAGE,

		PIPE_ROOM_AVAILABLE,
		PIPE_ROOM_UPDATE,
	};

	private readonly connectionState = atoms.create<LeapConnectionState | null>(
		null,
	);

	private leap: LeapEdgeClient | null = null;

	private readonly channelStateMap = new maps.ObservableMap<
		API.Channels.Channel['id'],
		ChannelStateData<API.Channels.State>
	>();

	private readonly channelMessageListeners = new Map<
		channels.ChannelMessageListenerKey,
		Set<(data: unknown) => unknown>
	>();

	private readonly directMessageListeners = new Map<
		string,
		Set<(data: unknown) => unknown>
	>();

	private readonly roomStateMap = new maps.ObservableMap<
		API.Pipe.Room['id'],
		RoomStateData
	>();

	connect(auth: LeapEdgeAuthenticationParameters) {
		if (this.leap) {
			return;
		}

		const leap = this.getLeap(auth);

		const serviceEvent = async (message: LeapServiceEvent) => {
			await this.handleServiceEvent(message);
		};

		const connectionStateUpdate = async (state: LeapConnectionState) => {
			await this.handleConnectionStateUpdate(state);
		};

		leap.on('serviceEvent', serviceEvent);
		leap.on('connectionStateUpdate', connectionStateUpdate);

		this.getLeap().connect();
	}

	subscribeToPipeRoom(roomId: API.Pipe.Room['id']) {
		this.send({
			e: 'PIPE_ROOM_SUBSCRIBE',
			c: roomId,
			d: null,
		});

		this.roomStateMap.set(roomId, {
			subscription: 'pending',
		});
	}

	addMessageSubscription<T>(
		channel: API.Channels.Channel['id'],
		eventName: string,
		listener: (data: T) => unknown,
	) {
		const map = this.getMessageListeners();
		const key = channels.getMessageListenerKey(channel, eventName);
		const listeners = map.get(key) ?? new Set();

		const castListener = listener as (data: unknown) => unknown;
		map.set(key, listeners.add(castListener));

		return {
			unsubscribe() {
				const currentListeners = map.get(key);

				if (!currentListeners) {
					return;
				}

				currentListeners.delete(castListener);

				if (currentListeners.size === 0) {
					map.delete(key);
				}
			},
		};
	}

	getCurrentSubscriptions() {
		return [...this.channelStateMap.entries()]
			.filter(entry => {
				const [, {subscription}] = entry;
				return subscription === 'available';
			})
			.map(entry => entry[0]);
	}

	getChannelStateMap() {
		return this.channelStateMap;
	}

	getRoomStateMap() {
		return this.roomStateMap;
	}

	getMessageListeners() {
		return this.channelMessageListeners;
	}

	getDirectMessageListeners() {
		return this.directMessageListeners;
	}

	getConnectionState(fullAtom?: false): LeapConnectionState | null;
	getConnectionState(fullAtom: true): atoms.Atom<LeapConnectionState>;
	getConnectionState(fullAtom = false) {
		if (fullAtom) {
			return this.connectionState;
		}

		return this.connectionState.get();
	}

	subscribeToChannel(channel: API.Channels.Channel['id']) {
		const state: ChannelStateData<API.Channels.State> = {
			subscription: 'pending',
			state: null,
			error: null,
		};

		this.channelStateMap.set(channel, state);

		this.send({
			e: 'SUBSCRIBE',
			d: null,
			c: channel,
		});

		return state;
	}

	unsubscribeFromChannel(channel: API.Channels.Channel['id']) {
		this.channelStateMap.delete(channel);

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

	private async handleConnectionStateUpdate(state: LeapConnectionState) {
		this.connectionState.set(state);
	}

	private async handleServiceEvent(event: LeapServiceEvent) {
		const handler = Client.SUPPORTED_EVENTS[event.eventType] as
			| LeapHandler
			| undefined;

		if (!handler) {
			console.warn(
				'[@onehop/client] Channels: Received unsupported opcode!',
				event,
			);

			return;
		}

		try {
			await handler.handle(this, event);
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
