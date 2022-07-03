import {API} from '@onehop/js';

export const getMessageListenerKey = (
	channel: API.Channels.Channel['id'],
	event: string,
) => `${channel}:${event}` as const;

export type ChannelMessageListenerKey = ReturnType<
	typeof getMessageListenerKey
>;
