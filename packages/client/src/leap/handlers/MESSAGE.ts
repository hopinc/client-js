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

		client.emit('MESSAGE', {
			event,
			data: messageData,
			channel,
		});

		const key = getMessageListenerKey(channel, event);

		const listeners = client.getChannelMessageListeners().get(key);

		if (!listeners) {
			return;
		}

		if (listeners.size === 0) {
			client.getChannelMessageListeners().delete(key);
			return;
		}

		for (const listener of listeners) {
			listener(messageData);
		}
	},
});
