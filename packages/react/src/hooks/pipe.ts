import {pipe, util} from '@onehop/client';
import {API} from '@onehop/js';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {
	createContext,
	RefObject,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from 'react';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet, useObserveObservableMap} from './maps';

export type Config = {
	joinToken: string | null;
	ref: RefObject<HTMLVideoElement | null>;
	autojoin?: boolean;
};

export const trackedPipeComponents = createContext(
	new util.maps.ObservableMap<
		API.Pipe.Room['join_token'],
		util.atoms.Atom<number>
	>(),
);

export function useTrackedPipeComponentCount(joinToken: string | null) {
	const map = useContext(trackedPipeComponents);
	const state = useObservableMapGet(map, joinToken ?? undefined);

	const leap = useLeap();

	useEffect(() => {
		if (!state && joinToken) {
			map.set(joinToken, util.atoms.create(0));
		}
	}, [state, joinToken]);

	useEffect(() => {
		if (!joinToken || !state) {
			return;
		}

		state.set(state.get() + 1);

		return () => {
			const value = state.get() - 1;

			if (value === 0) {
				leap.unsubscribeFromRoom(joinToken);
				map.delete(joinToken);
			} else {
				state.set(value);
			}
		};
	}, [joinToken, state]);
}

export function usePipeRoom({ref, autojoin = true, joinToken}: Config) {
	const leap = useLeap();
	const connectionState = useConnectionState();

	const events = useMemo(
		() =>
			util.emitter.create<{
				ROOM_UPDATE: API.Pipe.Room;
			}>(),
		[],
	);

	const roomStateMap = leap.getRoomStateMap();

	useObserveObservableMap(
		roomStateMap,
		useCallback(
			m => {
				if (!joinToken) {
					return;
				}

				const data = m.get(joinToken);

				if (!data || !data.room) {
					return;
				}

				events.emit('ROOM_UPDATE', data.room);
			},
			[joinToken],
		),
	);

	const stream = useObservableMapGet(roomStateMap, joinToken ?? undefined);

	useTrackedPipeComponentCount(joinToken);

	useEffect(() => {
		if (connectionState !== LeapConnectionState.CONNECTED) {
			return;
		}

		if (!autojoin) {
			return;
		}

		if (autojoin && stream?.subscription === 'available') {
			return;
		}

		if (!joinToken) {
			return;
		}

		if (leap.getRoomStateMap().has(joinToken)) {
			return;
		}

		leap.subscribeToPipeRoom(joinToken);
	}, [connectionState, autojoin, joinToken, stream?.subscription]);

	const canPlay =
		connectionState === LeapConnectionState.CONNECTED &&
		ref.current !== null &&
		stream?.subscription === 'available' &&
		stream.connection.llhls?.edge_endpoint !== undefined;

	useEffect(() => {
		if (!canPlay) {
			return;
		}

		const controls = pipe.mount(
			ref.current,
			stream.connection.llhls!.edge_endpoint,
		);

		return () => {
			controls.destroy();
		};
	}, [canPlay, ref.current]);

	return {
		live: stream?.room?.state === 'live',
		canPlay,
		subscription: stream?.subscription ?? ('non_existent' as const),
		events,
		join() {
			if (!joinToken) {
				throw new Error(
					'Cannot join a room without a valid join token passed to `usePipeRoom`.',
				);
			}

			leap.subscribeToPipeRoom(joinToken);
		},
	};
}
