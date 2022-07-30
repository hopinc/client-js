import {pipe, util, hls} from '@onehop/client';
import {API} from '@onehop/js';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {
	createContext,
	RefObject,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet, useObserveObservableMap} from './maps';
import {useInterval} from './timeout';

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
	const [controls, setControls] = useState<pipe.Controls | null>(null);
	const [buffering, setBuffering] = useState(false);
	const [lastLatencyEmit] = useState(() => util.atoms.create(-1));

	const events = useMemo(
		() =>
			util.emitter.create<{
				ROOM_UPDATE: API.Pipe.Room;
				BUFFERING: {buffering: boolean};
				ESTIMATED_LATENCY: {latency: number};
			}>(),
		[],
	);

	useInterval(500, () => {
		if (!controls?.hls) {
			return;
		}

		if (controls.hls.latency === lastLatencyEmit.get()) {
			return;
		}

		lastLatencyEmit.set(controls.hls.latency);

		events.emit('ESTIMATED_LATENCY', {
			latency: controls.hls.latency,
		});
	});

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

		leap.subscribeToRoom(joinToken);
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

		setControls(controls);

		const errorListener = (event: hls.Events.ERROR, data: hls.ErrorData) => {
			if (data.details !== hls.ErrorDetails.BUFFER_STALLED_ERROR) {
				return;
			}

			events.emit('BUFFERING', {buffering: true});
			setBuffering(true);
		};

		const fragBufferedListener = (
			event: hls.Events.FRAG_BUFFERED,
			data: hls.FragBufferedData,
		) => {
			events.emit('BUFFERING', {buffering: false});
			setBuffering(false);
		};

		if (controls.isNative) {
			// iOS Safari polyfills
			setBuffering(false);
		} else {
			controls.hls?.on(hls.Events.ERROR, errorListener);
			controls.hls?.on(hls.Events.FRAG_BUFFERED, fragBufferedListener);
		}

		return () => {
			controls.destroy();
			setControls(null);

			controls.hls?.off(hls.Events.ERROR, errorListener);
			controls.hls?.off(hls.Events.FRAG_BUFFERED, fragBufferedListener);
		};
	}, [canPlay, ref.current]);

	return {
		live: stream?.room?.state === 'live',
		canPlay,
		subscription: stream?.subscription ?? ('non_existent' as const),
		events,
		buffering,
		controls,

		/**
		 * Gets the estimated position (in seconds) of live edge (ie edge of live playlist plus time sync playlist advanced) returns 0 before first playlist is loaded
		 */
		getLiveSync() {
			return controls?.hls?.liveSyncPosition ?? null;
		},
		/**
		 * Gets the estimated position (in seconds) of live edge (ie edge of live playlist plus time sync playlist advanced) returns 0 before first playlist is loaded
		 */
		getLatency() {
			return controls?.hls?.latency ?? null;
		},

		/**
		 * Requests a subscription to the pipe room. You only need to use this if you don't use the autojoin feature.
		 */
		join() {
			if (!joinToken) {
				throw new Error(
					'Cannot join a room without a valid join token passed to `usePipeRoom`.',
				);
			}

			leap.subscribeToRoom(joinToken);
		},
	};
}
