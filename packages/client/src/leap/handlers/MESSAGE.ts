import {getMessageListenerKey} from '../../util/channels';
import {createLeapEvent} from './create';

export const MESSAGE = createLeapEvent({
	async handle(
		client,
		channel,
		data: {
			e: string;
			d: unknown;
		},
	) {
		const {e: event, d: messageData} = data;

		const key = getMessageListenerKey(channel, event);

		const listeners = client.getMessageListeners().get(key);

		if (!listeners) {
			console.warn('Received a message that nobody wants to listen for');
			return;
		}

		if (listeners.size === 0) {
			client.getMessageListeners().delete(key);
			return;
		}

		client.emit('MESSAGE', {
			event,
			data: messageData,
		});

		for (const listener of listeners) {
			listener(messageData);
		}
	},
});
