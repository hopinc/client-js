import {API} from '@onehop/js';
import {ClientContext} from '../../hooks/channels';

export function createLeapEvent<D, R, G extends boolean = true>(config: {
	requireChannelId?: G;

	handle: (
		client: ClientContext,
		channelId: G extends true
			? API.Channels.Channel['id']
			: API.Channels.Channel['id'] | null,
		data: D,
	) => Promise<R>;
}) {
	return {
		handle: (
			client: ClientContext,
			channelId: API.Channels.Channel['id'] | null,
			data: D,
		) => {
			const requireChannelId = config.requireChannelId !== false;

			if (!channelId && requireChannelId) {
				throw new Error('Required channel ID for setting unavailable state.');
			}

			return config.handle(
				client,
				channelId as G extends true
					? API.Channels.Channel['id']
					: API.Channels.Channel['id'] | null,
				data,
			);
		},
	};
}
