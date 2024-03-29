import {createLeapEvent} from './create';

export const DIRECT_MESSAGE = createLeapEvent({
	requireId: false,

	async handle(client, channel, data: {e: string; d: unknown}) {
		const {e: event, d: messageData} = data;

		client.emit('MESSAGE', {
			event,
			data: messageData,
			channel: null,
		});

		const listeners = client.getDirectMessageListeners().get(event);

		if (!listeners) {
			return;
		}

		if (listeners.size === 0) {
			client.getDirectMessageListeners().delete(event);
			return;
		}

		for (const listener of listeners) {
			listener(messageData);
		}
	},
});
