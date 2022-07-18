import {pipe} from '@onehop/client';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {RefObject, useEffect} from 'react';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet} from './maps';

export interface Config {
	joinToken: string | null;
	ref: RefObject<HTMLVideoElement | null>;
	autojoin?: boolean;
}

export function usePipeRoom({ref, autojoin = true, ...config}: Config) {
	const leap = useLeap();
	const connectionState = useConnectionState();

	const stream = useObservableMapGet(
		leap.getRoomStateMap(),
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

		leap.subscribeToPipeRoom(config.joinToken);
	}, [connectionState]);

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
		canPlay,
		subscription: stream?.subscription ?? ('non_existent' as const),
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
