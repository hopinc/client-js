import {API} from '@onehop/js';

export type LeapChannelSubscriptionError = 'NOT_GRANTED' | 'UNKNOWN';

export type GenericSubscriptionState = 'available' | 'pending' | 'unavailable';

export type ChannelStateData<T extends API.Channels.State> = {
	state: T | null;
	subscription: GenericSubscriptionState;
	error: LeapChannelSubscriptionError | null;
};

export type RoomStateData = {
	subscription: GenericSubscriptionState;
};
