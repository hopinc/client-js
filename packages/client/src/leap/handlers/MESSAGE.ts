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

		const listeners = client.getChannelMessageListeners().get(key);

		if (!listeners) {
			console.warn('Received a message that nobody wants to listen for');
			return;
		}

		if (listeners.size === 0) {
			client.getChannelMessageListeners().delete(key);
			return;
		}

		client.emit('MESSAGE', {
			event,
			data: messageData,
			channel,
		});

		for (const listener of listeners) {
			listener(messageData);
		}
	},
});
