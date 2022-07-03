import {API} from '@onehop/js';
import {LeapServiceEvent} from '@onehop/leap-edge-js';
import type {Client} from '..';

export interface LeapHandler {
	handle(client: Client, event: LeapServiceEvent): Promise<void>;
}

export function createLeapEvent<D, G extends boolean = true>(config: {
	requireChannelId?: G;

	handle: (
		client: Client,
		channelId: G extends true
			? API.Channels.Channel['id']
			: API.Channels.Channel['id'] | null,
		data: D,
	) => Promise<void>;
}): LeapHandler {
	return {
		async handle(client: Client, event: LeapServiceEvent) {
			const requireChannelId = config.requireChannelId !== false;

			if (!event.channelId && requireChannelId) {
				throw new Error(
					`Received opcode for ${event.eventType} but expected a channel ID that was not there.`,
				);
			}

			await config.handle(
				client,
				event.channelId as G extends true
					? API.Channels.Channel['id']
					: API.Channels.Channel['id'] | null,
				event.data as any,
			);
		},
	};
}
