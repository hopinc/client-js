import type {leap} from '@onehop/client';
import {type API, IS_BROWSER} from '@onehop/js';
import {useEffect} from 'react';
import {ConnectionState} from '..';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet} from './maps';

export function useChannelMessage<T = any>(
	channel: API.Channels.Channel['id'],
	event: string,
	listener: (data: T) => unknown,
) {
	const client = useLeap();
	const connectionState = useConnectionState();

	const data = useObservableMapGet(client.getChannelStateMap(), channel);

	useEffect(() => {
		if (
			IS_BROWSER &&
			connectionState === ConnectionState.CONNECTED &&
			(!data || data.subscription === 'non_existent')
		) {
			client.subscribeToChannel(channel);
		}
	}, [connectionState, data?.state]);

	useEffect(() => {
		const unsubscribe = client.addMessageSubscription(channel, event, listener);

		return () => {
			unsubscribe();
		};
	}, [channel, event, listener]);
}

export function useDirectMessage<T = any>(
	event: string,
	listener: (data: T) => unknown,
) {
	const client = useLeap();

	const castListener = listener as (data: unknown) => unknown;

	useEffect(() => {
		const listeners = client.getDirectMessageListeners().get(event);

		if (listeners) {
			listeners.add(castListener);
		} else {
			client.getDirectMessageListeners().set(event, new Set([castListener]));
		}

		return () => {
			const listeners = client.getDirectMessageListeners().get(event);

			if (!listeners) {
				return;
			}

			if (listeners.size === 0) {
				client.getDirectMessageListeners().delete(event);
				return;
			}

			listeners.delete(castListener);
		};
	}, [event]);
}

export function useReadChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): leap.ChannelStateData<T> {
	const client = useLeap();
	const connectionState = useConnectionState();

	const data = useObservableMapGet(client.getChannelStateMap(), channel) as
		| leap.ChannelStateData<T>
		| undefined;

	useEffect(() => {
		if (
			IS_BROWSER &&
			connectionState === ConnectionState.CONNECTED &&
			(!data || data.subscription === 'non_existent')
		) {
			client.subscribeToChannel(channel);
		}
	}, [connectionState, data?.subscription, data?.state, channel]);

	if (!data) {
		const nonExistentData: leap.ChannelStateData<T> = {
			state: null,
			error: null,
			subscription: 'non_existent',
		};

		client.getChannelStateMap().set(channel, nonExistentData);

		return nonExistentData;
	}

	return data;
}
