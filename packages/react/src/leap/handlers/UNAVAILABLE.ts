import {createLeapEvent} from './create';

export const UNAVAILABLE = createLeapEvent({
	async handle(client, channel, data) {
		client.getChannelStateMap().set(channel, {
			error: null,
			state: null,
			subscription: 'unavailable',
		});
	},
});
