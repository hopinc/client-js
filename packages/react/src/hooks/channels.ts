import {leap, util} from '@onehop/client';
import {API} from '@onehop/js';
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

	useEffect(() => {
		const subscription = client.addMessageSubscription(
			channel,
			event,
			listener,
		);

		return () => {
			subscription.remove();
		};
	}, []);
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
	}, [connectionState, data?.state]);

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
