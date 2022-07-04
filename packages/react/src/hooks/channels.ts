import {channels, util} from '@onehop/client';
import {API} from '@onehop/js';
import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useEffect,
} from 'react';
import {resolveSetStateAction} from '../util/state';
import {useAtom} from './atoms';
import {useObservableMap} from './maps';

const clientContext = createContext(new channels.Client());

export function useChannels(): channels.Client {
	return useContext(clientContext);
}

export function useSendChannelMessage<T = any>(
	channel: string,
	eventName: string,
) {
	const client = useChannels();

	return (data: T) => {
		client.sendMessage(channel, eventName, data);
	};
}

export function useChannelMessage<T = any>(
	channel: API.Channels.Channel['id'],
	event: string,
	listener: (data: T) => unknown,
) {
	const client = useChannels();
	const map = client.getMessageListeners();

	useEffect(() => {
		const subscription = client.addMessageSubscription(
			channel,
			event,
			listener,
		);

		return () => {
			subscription.unsubscribe();
		};
	}, []);
}

export function useChannelsConnectionState() {
	const client = useChannels();

	return useAtom(client.getConnectionState(true));
}

export function useReadChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): channels.ClientStateData<T> {
	const client = useChannels();
	const map = client.getChannelStateMap();
	const state = useObservableMap(map);
	const data = state.get(channel) as channels.ClientStateData<T> | undefined;

	if (!data) {
		client.subscribeToChannel(channel);

		const state: channels.ClientStateData<T> = {
			state: null,
			error: null,
			subscription: 'pending',
		};

		return state;
	}

	return data;
}

export function useSetChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: API.Channels.Channel['id']): Dispatch<SetStateAction<T>> {
	const client = useChannels();
	const state = useObservableMap(client.getChannelStateMap());
	const oldState = state.get(channel);

	return value => {
		if (!oldState) {
			return;
		}

		const newState = resolveSetStateAction<T>(oldState.state as T, value);

		client.setChannelState(channel, newState);

		state.patch(channel, {
			state: newState,
		});
	};
}

export function useChannelState<
	T extends API.Channels.State = API.Channels.State,
>(
	channel: API.Channels.Channel['id'],
): [data: channels.ClientStateData<T>, setState: Dispatch<SetStateAction<T>>] {
	const state = useReadChannelState<T>(channel);
	const setState = useSetChannelState<T>(channel);

	return [state, setState];
}
