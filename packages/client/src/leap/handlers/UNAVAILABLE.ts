import type {LeapChannelSubscriptionError} from '../index';
import {createLeapEvent} from './create';

export const UNAVAILABLE = createLeapEvent({
	async handle(
		client,
		channel,
		data: {graceful: boolean; error_code?: LeapChannelSubscriptionError},
	) {
		client.getChannelStateMap().set(channel, {
			state: null,
			subscription: 'unavailable',
			error: data,
		});
	},
});
