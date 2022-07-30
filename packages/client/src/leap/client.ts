import {API} from '@onehop/js';

import {
	EncapsulatingServicePayload,
	LeapConnectionState,
	LeapEdgeAuthenticationParameters,
	LeapEdgeClient,
	LeapServiceEvent,
} from '@onehop/leap-edge-js';

import {atoms, channels, maps} from '../util';
import {ChannelStateData, RoomStateData} from './types';

import {AVAILABLE} from './handlers/AVAILABLE';
import {LeapHandler} from './handlers/create';
import {INIT} from './handlers/INIT';
import {MESSAGE} from './handlers/MESSAGE';
import {PIPE_ROOM_AVAILABLE} from './handlers/PIPE_ROOM_AVAILABLE';
import {PIPE_ROOM_UNAVAILABLE} from './handlers/PIPE_ROOM_UNAVAILABLE';
import {PIPE_ROOM_UPDATE} from './handlers/PIPE_ROOM_UPDATE';
import {STATE_UPDATE} from './handlers/STATE_UPDATE';
import {TOKEN_STATE_UPDATE} from './handlers/TOKEN_STATE_UPDATE';
import {UNAVAILABLE} from './handlers/UNAVAILABLE';
import {util} from '..';

export class Client {
	public static readonly SUPPORTED_EVENTS: Record<string, LeapHandler> = {
		INIT,
		AVAILABLE,
		UNAVAILABLE,
		STATE_UPDATE,
		TOKEN_STATE_UPDATE,
		MESSAGE,

		PIPE_ROOM_UNAVAILABLE,
		PIPE_ROOM_AVAILABLE,
		PIPE_ROOM_UPDATE,
	};

	public hasPreviouslyConnected = false;

	private readonly connectionState = atoms.create<LeapConnectionState>(
		LeapConnectionState.IDLE,
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
		API.Pipe.Room['join_token'],
		RoomStateData
	>();

	private readonly rawServiceEventListeners = new Set<
		(message: LeapServiceEvent) => unknown
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

	/*
	 * @deprecated	Use getCurrentAvailableSubscriptions() instead
	 */
	getCurrentSubscriptions() {
		console.warn(
			'getCurrentSubscriptions is deprecated and will be removed in a near update',
		);
		return this.getCurrentAvailableSubscriptions().channels;
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

	getMessageListeners() {
		return this.channelMessageListeners;
	}

	getDirectMessageListeners() {
		return this.directMessageListeners;
	}

	getConnectionState(fullAtom?: false): LeapConnectionState;
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
		if (
			state === LeapConnectionState.CONNECTING &&
			this.hasPreviouslyConnected
		) {
			const l = this.connectionState.addListener(state => {
				if (state !== LeapConnectionState.CONNECTED) {
					return;
				}

				const {channels, rooms} = this.getCurrentAvailableSubscriptions();

				console.log('Leap reconnected, resubscribing to', {
					channels,
					rooms,
				});

				for (const channel of channels) {
					this.subscribeToChannel(channel);
				}

				for (const room of rooms) {
					this.subscribeToRoom(room);
				}

				l.remove();
			});
		}

		if (!this.hasPreviouslyConnected) {
			this.hasPreviouslyConnected = true;
		}

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

export const instance = new Client();
