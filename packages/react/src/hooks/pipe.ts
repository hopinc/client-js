import {pipe, util} from '@onehop/client';
import {API} from '@onehop/js';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {RefObject, useCallback, useEffect, useMemo} from 'react';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet, useObserveObservableMap} from './maps';

export interface Config {
	joinToken: string | null;
	ref: RefObject<HTMLVideoElement | null>;
	autojoin?: boolean;
}

export function usePipeRoom({ref, autojoin = true, ...config}: Config) {
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
				if (!config.joinToken) {
					return;
				}

				const data = m.get(config.joinToken);

				if (!data || !data.room) {
					return;
				}

				events.emit('ROOM_UPDATE', data.room);
			},
			[config.joinToken],
		),
	);

	const stream = useObservableMapGet(
		roomStateMap,
		config.joinToken ?? undefined,
	);

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

		if (!config.joinToken) {
			return;
		}

		if (leap.getRoomStateMap().has(config.joinToken)) {
			return;
		}

		leap.subscribeToPipeRoom(config.joinToken);
	}, [connectionState, autojoin, config.joinToken, stream?.subscription]);

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
			if (!config.joinToken) {
				throw new Error(
					'Cannot join a room without a valid join token passed to `usePipeRoom`.',
				);
			}

			leap.subscribeToPipeRoom(config.joinToken);
		},
	};
}
