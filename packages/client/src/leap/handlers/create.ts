import {API} from '@onehop/js';
import {LeapServiceEvent} from '@onehop/leap-edge-js';
import type {Client} from '..';

export interface LeapHandler {
	handle(client: Client, event: LeapServiceEvent): Promise<void>;
}

export function createLeapEvent<D, G extends boolean = true>(config: {
	requireId?: G;

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
			const requireId = config.requireId !== false;

			if (!event.channelId && requireId) {
				throw new Error(
					`Received opcode for ${event.eventType} but expected an ID that was not there.`,
				);
			}

			await config.handle(client, event.channelId!, event.data as any);
		},
	};
}
