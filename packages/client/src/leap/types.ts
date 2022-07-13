import {API} from '@onehop/js';

export type LeapChannelSubscriptionError = 'NOT_GRANTED' | 'UNKNOWN';

export type ChannelStateData<T extends API.Channels.State> = {
	state: T | null;
	subscription: 'available' | 'pending' | 'unavailable';
	error: LeapChannelSubscriptionError | null;
};
