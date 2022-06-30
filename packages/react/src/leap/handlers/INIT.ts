import {API} from '@onehop/js';
import {ClientStateData} from '../../hooks/channels';
import {createLeapEvent} from './create';

export type Data = {
	channels: API.Channels.Channel[];
	metadata: unknown;
	cid: string;
	connection_count: number;
	scope: 'project' | 'token';
};

export const INIT = createLeapEvent({
	requireChannelId: false,

	async handle(client, channelId, data: Data) {
		const localState = new Map<
			API.Channels.Channel['id'],
			ClientStateData<API.Channels.State>
		>();

		for (const channel of data.channels) {
			client.subscribeToChannel(channel.id);

			localState.set(channel.id, {
				error: null,
				state: channel.state,
				subscription: 'pending',
			});
		}

		client.getChannelStateMap().merge(localState);
	},
});
