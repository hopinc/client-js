import {API} from '@onehop/js';
import {createLeapEvent} from './create';

export const STATE_UPDATE = createLeapEvent({
	async handle(client, channel, data: {state: API.Channels.State}) {
		client.getChannelStateMap().patch(channel, {
			state: data.state,
		});
	},
});
