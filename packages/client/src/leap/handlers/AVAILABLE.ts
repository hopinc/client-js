import type {API} from '@onehop/js';
import {createLeapEvent} from './create';

export const AVAILABLE = createLeapEvent({
	async handle(
		client,
		channelId,
		data: {
			channel: API.Channels.Channel;
		},
	) {
		client.getChannelStateMap().set(channelId, {
			error: null,
			state: data.channel.state,
			subscription: 'available',
		});
	},
});
