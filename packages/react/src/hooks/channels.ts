import {API} from '@onehop/js';
import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useEffect,
} from 'react';
import {resolveSetStateAction} from '../util/state';
import {ChannelClient, ClientStateData, util} from '@onehop/client';
import {useAtom} from './atoms';
import {useObservableMap} from './maps';

const clientContext = createContext(new ChannelClient());

export function useClientContext(): ChannelClient {
	return useContext(clientContext);
}

export function useChannelMessage<T = any>(
	channel: API.Channels.Channel['id'],
	event: string,
	listener: (data: T) => unknown,
) {
	const client = useClientContext();
	const map = client.getMessageListeners();

	useEffect(() => {
		const key = util.channels.getMessageListenerKey(channel, event);
		const listeners = map.get(key) ?? new Set();

		const castListener = listener as (data: unknown) => unknown;

		map.set(key, listeners.add(castListener));

		return () => {
			const currentListeners = map.get(key);

			if (!currentListeners) {
				return;
			}

			currentListeners.delete(castListener);

			if (currentListeners.size === 0) {
				map.delete(key);
			}
		};
	}, []);
}

export function useChannels() {
	return useAtom(ChannelClient.CONNECTION_STATE);
}

export function useReadChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): ClientStateData<T> {
	const client = useClientContext();
	const map = client.getChannelStateMap();
	const state = useObservableMap(map);
	const data = state.get(channel) as ClientStateData<T> | undefined;

	if (!data) {
		client.subscribeToChannel(channel);

		const state: ClientStateData<T> = {
			state: null,
			error: null,
			subscription: 'pending',
		};

		map.set(channel, state);

		return state;
	}

	return data;
}

export function useSetChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): Dispatch<SetStateAction<T>> {
	const client = useClientContext();
	const state = useObservableMap(client.getChannelStateMap());
	const oldState = state.get(channel);

	return value => {
		if (!oldState) {
			return;
		}

		const newState = resolveSetStateAction<T>(oldState.state as T, value);

		client.send({
			e: 'SET_CHANNEL_STATE',
			c: channel,
			d: newState,
		});

		state.patch(channel, {
			state: newState,
		});
	};
}

export function useChannelState<
	T extends API.Channels.State = API.Channels.State,
>(
	channel: API.Channels.Channel['id'],
): [data: ClientStateData<T>, setState: Dispatch<SetStateAction<T>>] {
	const state = useReadChannelState<T>(channel);
	const setState = useSetChannelState<T>(channel);

	return [state, setState];
}
