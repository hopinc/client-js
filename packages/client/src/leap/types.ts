import {API} from '@onehop/js';
import {Payload as PIPE_ROOM_AVAILABLE_PAYLOAD} from './handlers/PIPE_ROOM_AVAILABLE';

export type LeapChannelSubscriptionError = 'NOT_GRANTED' | 'UNKNOWN';

export type GenericSubscriptionState = 'available' | 'pending' | 'unavailable';

export type ChannelStateData<T extends API.Channels.State> = {
	state: T | null;
	subscription: GenericSubscriptionState;
	error: UnavailableError | null;
};

export type RoomStateData =
	| {subscription: 'pending'; room: null}
	| {subscription: 'unavailable'; room: null; error: UnavailableError}
	| {
			subscription: 'available';
			room: API.Pipe.Room;
			connection: PIPE_ROOM_AVAILABLE_PAYLOAD['connection'];
	  };

export type UnavailableError = {
	graceful: boolean;
	error_code?: LeapChannelSubscriptionError;
};
