import {LeapChannelSubscriptionError} from '@onehop/react/src/hooks/channels';
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
			error: data.error_code ?? null,
		});
	},
});
