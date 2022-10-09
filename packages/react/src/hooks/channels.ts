import type {leap} from '@onehop/client';
import type {API} from '@onehop/js';
import {
	// Dispatch, SetStateAction,
	useEffect,
} from 'react';
import {ConnectionState} from '..';
// import {resolveSetStateAction} from '../util/state';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet} from './maps';

// Right now we do not support sending messages to channels
// from the client.
// export function useSendChannelMessage<T = any>(
// 	channel: string,
// 	eventName: string,
// ) {
// 	const client = useLeap();

// 	return (data: T) => {
// 		client.sendMessage(channel, eventName, data);
// 	};
// }

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
			connectionState === ConnectionState.CONNECTED &&
			(!data || data.subscription === 'non_existent')
		) {
			client.subscribeToChannel(channel);
		}
	}, [connectionState, data?.state]);

	useEffect(() => {
		const subscription = client.addMessageSubscription(
			channel,
			event,
			listener,
		);

		return () => {
			subscription.remove();
		};
	}, [listener]);
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
			connectionState === ConnectionState.CONNECTED &&
			(!data || data.subscription === 'non_existent')
		) {
			client.subscribeToChannel(channel);
		}
	}, [connectionState, data?.subscription, data?.state]);

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

// export function useSetChannelState<
// 	T extends API.Channels.State = API.Channels.State,
// >(channel: API.Channels.Channel['id']): Dispatch<SetStateAction<T>> {
// 	const client = useLeap();
// 	const oldState = useObservableMapGet(client.getChannelStateMap(), channel);

// 	return value => {
// 		if (!oldState) {
// 			return;
// 		}

// 		const newState = resolveSetStateAction<T>(oldState.state as T, value);

// 		client.setChannelState(channel, newState);

// 		client.getChannelStateMap().patch(channel, {
// 			state: newState,
// 		});
// 	};
// }

// Right now, we do not support setting channel state from the client
// export function useChannelState<
// 	T extends API.Channels.State = API.Channels.State,
// >(
// 	channel: API.Channels.Channel['id'],
// ): [data: leap.ChannelStateData<T>, setState: Dispatch<SetStateAction<T>>] {
// 	const state = useReadChannelState<T>(channel);
// 	const setState = useSetChannelState<T>(channel);

// 	return [state, setState];
// }
