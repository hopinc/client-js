import type {API} from '@onehop/js';
import {createLeapEvent} from './create';

export const TOKEN_STATE_UPDATE = createLeapEvent({
	async handle(
		client,
		channelId,
		data: {
			state: API.Channels.State;
		},
	) {
		client.getChannelStateMap().patch(channelId, {
			state: data.state,
		});
	},
});
