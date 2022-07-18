import {pipe} from '@onehop/client';
import type {Controls} from '@onehop/client/src/pipe';
import {RefObject, useEffect, useState} from 'react';
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

	useEffect(() => {
		//
	}, [connectionState]);

	useEffect(() => {
		if (
			!ref.current ||
			stream?.subscription !== 'available' ||
			!stream.connection.llhls?.edge_endpoint
		) {
			return;
		}

		const controls = pipe.mount(
			ref.current,
			stream.connection.llhls.edge_endpoint,
		);

		setControls(controls);

		return () => {
			controls.destroy();
		};
	}, [stream, ref.current]);

	return {
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
