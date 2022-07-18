import {pipe} from '@onehop/client';
import type {Controls} from '@onehop/client/src/pipe';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {RefObject, useEffect, useState} from 'react';
import {ConnectionState} from '..';
import {useConnectionState, useLeap} from './leap';
import {useObservableMapGet} from './maps';

export interface Config {
	joinToken: string | null;
	ref: RefObject<HTMLVideoElement | null>;
}

export function usePipeRoom({ref, ...config}: Config) {
	const leap = useLeap();
	const connectionState = useConnectionState();

	const stream = useObservableMapGet(
		leap.getRoomStateMap(),
		config.joinToken ?? undefined,
	);

	const [controls, setControls] = useState<Controls | null>(null);

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

		return () => {
			controls.destroy();
		};
	}, [canPlay, ref.current]);

	return {
		canPlay,
		controls,
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
