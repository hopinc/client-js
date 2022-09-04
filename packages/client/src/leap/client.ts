import type {API} from '@onehop/js';

import type {
	EncapsulatingServicePayload,
	LeapEdgeAuthenticationParameters,
	LeapEdgeInitOptions,
	LeapServiceEvent,
} from '@onehop/leap-edge-js';
import {LeapEdgeClient} from '@onehop/leap-edge-js';
import {LeapConnectionState} from '@onehop/leap-edge-js';

import * as util from '../util';
import type {ChannelStateData, RoomStateData} from './types';

import type {Subscription} from '../util/types';
import {AVAILABLE} from './handlers/AVAILABLE';
import type {LeapHandler} from './handlers/create';
import {DIRECT_MESSAGE} from './handlers/DIRECT_MESSAGE';
import {INIT} from './handlers/INIT';
import {MESSAGE} from './handlers/MESSAGE';
import {PIPE_ROOM_AVAILABLE} from './handlers/PIPE_ROOM_AVAILABLE';
import {PIPE_ROOM_UNAVAILABLE} from './handlers/PIPE_ROOM_UNAVAILABLE';
import {PIPE_ROOM_UPDATE} from './handlers/PIPE_ROOM_UPDATE';
import {STATE_UPDATE} from './handlers/STATE_UPDATE';
import {TOKEN_STATE_UPDATE} from './handlers/TOKEN_STATE_UPDATE';
import {UNAVAILABLE} from './handlers/UNAVAILABLE';

export type ClientEvents = {
	MESSAGE: {
		event: string;
		data: unknown;
		channel: string | null;
	};

	STATE_UPDATE: {
		channel: string;
		state: unknown;
	};

	SERVICE_EVENT: LeapServiceEvent;

	CONNECTION_STATE_UPDATE: LeapConnectionState;
};

export class Client extends util.emitter.HopEmitter<ClientEvents> {
	public static readonly SUPPORTED_EVENTS: Record<string, LeapHandler> = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
		STATE_UPDATE,
		TOKEN_STATE_UPDATE,
		MESSAGE,
		DIRECT_MESSAGE,

		PIPE_ROOM_UNAVAILABLE,
		PIPE_ROOM_AVAILABLE,
		PIPE_ROOM_UPDATE,
	};

	public hasPreviouslyConnected = false;

	private readonly connectionState = util.atoms.create<LeapConnectionState>(
		LeapConnectionState.IDLE,
	);

	private leap: LeapEdgeClient | null = null;

	private readonly channelStateMap = new util.maps.ObservableMap<
		API.Channels.Channel['id'],
		ChannelStateData<API.Channels.State>
	>();

	private readonly channelMessageListeners = new Map<
		util.channels.ChannelMessageListenerKey,
		Set<(data: unknown) => unknown>
	>();

	private readonly directMessageListeners = new Map<
		string,
		Set<(data: unknown) => unknown>
	>();

	private readonly roomStateMap = new util.maps.ObservableMap<
		API.Pipe.Room['join_token'],
		RoomStateData
	>();

	private readonly rawServiceEventListeners = new Set<
		(message: LeapServiceEvent) => unknown
	>();

	// Rule is broken — constructor is not useless because HopEmitter#constructor is protected
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor() {
		super();
	}

	connect(auth: LeapEdgeAuthenticationParameters, opts?: LeapEdgeInitOptions) {
		if (this.leap) {
			return;
		}

		const leap = this.getLeap(auth, opts);

		const serviceEvent = async (message: LeapServiceEvent) => {
			this.emit('SERVICE_EVENT', message);
			await this.handleServiceEvent(message);
		};

		const connectionStateUpdate = async (state: LeapConnectionState) => {
			this.emit('CONNECTION_STATE_UPDATE', state);

			await this.handleConnectionStateUpdate(state);
		};

		leap.on('serviceEvent', serviceEvent);
		leap.on('connectionStateUpdate', connectionStateUpdate);
	}

	subscribeToRoom(joinToken: string) {
		const existingSubscription = this.roomStateMap.get(joinToken);

		const payload: EncapsulatingServicePayload = {
			e: 'PIPE_ROOM_SUBSCRIBE',
			c: null,
			d: {join_token: joinToken},
		};

		if (existingSubscription) {
			if (existingSubscription.subscription === 'unavailable') {
				this.send(payload);
			}

			return;
		}

		this.send(payload);

		this.roomStateMap.set(joinToken, {
			subscription: 'pending',
			room: null,
		});
	}

	unsubscribeFromRoom(joinToken: API.Pipe.Room['join_token']) {
		const stream = this.roomStateMap.get(joinToken);

		if (!stream) {
			throw new Error('Not subscribed to that room!');
		}

		// This condition is annoying, because we don't know the room ID
		// as we never received 'AVAILABLE'
		// but we still want to make sure its no longer in this.roomStateMap
		// and that the server isn't still processing our subscription

		// Context: An app where there are multiple streams of something
		// 1) User enters stream and subscribes (we don't receive PIPE_ROOM_AVAILABLE yet)
		// 2) User realises they pressed wrong stream and quickly hits back
		// 3) We never got the available message, so we never got the room id
		// 4) How unsibcsribe

		// This is a bit of a hack, but it works
		if (stream.subscription !== 'available') {
			const listener = (message: LeapServiceEvent) => {
				if (message.eventType !== 'PIPE_ROOM_AVAILABLE') {
					return;
				}

				this.unsubscribeFromRoom(joinToken);
				this.rawServiceEventListeners.delete(listener);
			};

			this.rawServiceEventListeners.add(listener);

			return;
		}

		this.roomStateMap.delete(joinToken);

		this.send({
			e: 'PIPE_ROOM_UNSUBSCRIBE',
			d: {
				id: stream.room.id,
			},
			c: null,
		});
	}

	addMessageSubscription<T>(
		channel: API.Channels.Channel['id'],
		eventName: string,
		listener: (data: T) => unknown,
	): Subscription {
		const map = this.getChannelMessageListeners();

		const key = util.channels.getMessageListenerKey(channel, eventName);

		const listeners = map.get(key) ?? new Set();
		const castListener = listener as (data: unknown) => unknown;

		map.set(key, listeners.add(castListener));

		return {
			remove() {
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

	/**
	 * Get a list of all subscriptions
	 * @returns A list of all channel and room names we are currently subscribed to
	 */
	getCurrentAvailableSubscriptions() {
		const filter = (
			value:
				| util.maps.ObservableMap<string, ChannelStateData<API.Channels.State>>
				| util.maps.ObservableMap<string, RoomStateData>,
		) =>
			[...value.entries()]
				.filter(([, entry]) => entry.subscription === 'available')
				.map(entry => entry[0]);

		return {
			channels: filter(this.getChannelStateMap()),
			rooms: filter(this.getRoomStateMap()),
		};
	}

	getChannelStateMap() {
		return this.channelStateMap;
	}

	getRoomStateMap() {
		return this.roomStateMap;
	}

	getChannelMessageListeners() {
		return this.channelMessageListeners;
	}

	getDirectMessageListeners() {
		return this.directMessageListeners;
	}

	getConnectionState(fullAtom?: false): LeapConnectionState;
	getConnectionState(fullAtom: true): util.atoms.Atom<LeapConnectionState>;
	getConnectionState(fullAtom = false) {
		if (fullAtom) {
			return this.connectionState;
		}

		return this.connectionState.get();
	}

	subscribeToChannel(channel: API.Channels.Channel['id']) {
		const s = this.channelStateMap.get(channel)?.subscription;
		if (s && s === 'available') {
			return;
		}

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
		if (state === LeapConnectionState.ERRORED && this.hasPreviouslyConnected) {
			const l = this.connectionState.addListener(state => {
				if (state !== LeapConnectionState.CONNECTED) {
					return;
				}

				// If we have a leap token, subscriptions are persisted
				// on the server. There's no need to resubscribe.
				if (!this.getLeap().auth.token) {
					this.resubscribe();
				}

				l.remove();
			});
		}

		if (!this.hasPreviouslyConnected) {
			this.hasPreviouslyConnected = true;
		}

		this.connectionState.set(state);
	}

	private resubscribe() {
		const {channels, rooms} = this.getCurrentAvailableSubscriptions();

		console.log('resubscribing to', {
			channels,
			rooms,
		});

		for (const channel of channels) {
			this.subscribeToChannel(channel);
		}

		for (const room of rooms) {
			this.subscribeToRoom(room);
		}
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

	private getLeap(
		auth?: LeapEdgeAuthenticationParameters,
		opts?: LeapEdgeInitOptions,
	) {
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

		this.leap = new LeapEdgeClient(auth, opts);
		this.leap.connect();

		return this.leap;
	}
}

export const instance = new Client();
