import {createLeapEvent} from './create';

export const DIRECT_MESSAGE = createLeapEvent({
	requireId: false,

	async handle(client, channel, data: {e: string; d: unknown}) {
		const {e: event, d: messageData} = data;

		const listeners = client.getDirectMessageListeners().get(event);

		if (!listeners) {
			console.warn('Received a message that nobody wants to listen for');
			return;
		}

		if (listeners.size === 0) {
			client.getDirectMessageListeners().delete(event);
			return;
		}

		client.emit('MESSAGE', {
			event,
			data: messageData,
			channel: null,
		});

		for (const listener of listeners) {
			listener(messageData);
		}
	},
});
