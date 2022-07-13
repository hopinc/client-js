import {API} from '@onehop/js';
import {ChannelStateData} from '..';
import {createLeapEvent} from './create';

export type Data = {
	channels: API.Channels.Channel[];
	metadata: API.Channels.State;
	cid: string;
	connection_count: number;
	scope: 'project' | 'token';
};

export const INIT = createLeapEvent({
	requireChannelId: false,

	async handle(client, channelId, data: Data) {
		const localState = new Map<
			API.Channels.Channel['id'],
			ChannelStateData<API.Channels.State>
		>();

		for (const channel of data.channels) {
			client.subscribeToChannel(channel.id);

			localState.set(channel.id, {
				state: channel.state,
				subscription: 'pending',
				error: null,
			});
		}

		client.getChannelStateMap().merge(localState);
	},
});
