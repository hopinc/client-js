import {API} from '@onehop/js';
import {createLeapEvent} from './create';

export const getMessageListenerKey = (
	channel: API.Channels.Channel['id'],
	event: string,
) => `${channel}:${event}` as const;

export type ChannelMessageListenerKey = ReturnType<
	typeof getMessageListenerKey
>;

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

		const listeners = client
			.getMessageListeners()
			.get(getMessageListenerKey(channel, event));

		if (!listeners) {
			console.warn('Received a message that nobody wants to listen for');
			return;
		}

		for (const listener of listeners) {
			listener(messageData);
		}
	},
});
