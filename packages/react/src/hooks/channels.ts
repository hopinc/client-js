import type {API, Id} from '@onehop/js';
import {createContext, Dispatch, SetStateAction, useContext} from 'react';
import {
	LeapEdgeClient,
	LeapEdgeAuthenticationParameters,
} from '@onehop/leap-edge-js';
import {ObservableMap, useObservableMap} from '../util/maps';
import {resolveSetStateAction} from '../util/state';

export class ClientContext {
	private static leap: LeapEdgeClient | null = null;

	private readonly stateCache = new ObservableMap<
		Id<'channel'>,
		API.Channels.State
	>();

	useChannelState(channel: Id<'channel'>) {
		return useObservableMap(this.stateCache).get(channel) ?? null;
	}

	getStateCache() {
		return this.stateCache;
	}

	getLeap(auth?: LeapEdgeAuthenticationParameters) {
		if (ClientContext.leap) {
			return ClientContext.leap;
		}

		if (!auth) {
			throw new Error(
				'Cannot create a new Leap instance as no authentication params were provided',
			);
		}

		ClientContext.leap = new LeapEdgeClient(auth);
		ClientContext.leap.connect();

		ClientContext.leap.on('serviceEvent', state => {
			state.data;
		});

		return ClientContext.leap;
	}
}

export const clientContext = createContext(new ClientContext());

export function useClientContext() {
	return useContext(clientContext);
}

export function useReadChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: Id<'channel'>): T {
	const client = useClientContext();
	const state = client.useChannelState(channel);

	return state as T;
}

export function useSetChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: Id<'channel'>): Dispatch<SetStateAction<T>> {
	const client = useClientContext();
	const state = useObservableMap(client.getStateCache());
	const oldState = client.useChannelState(channel);

	return value => {
		const newState = resolveSetStateAction<T>(oldState as T, value);
		state.set(channel, newState);
	};
}

export function useChannelState<
	T extends API.Channels.State = API.Channels.State,
>(channel: Id<'channel'>) {
	return [
		useReadChannelState<T>(channel),
		useSetChannelState<T>(channel),
	] as const;
}
