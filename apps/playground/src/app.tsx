import {
	useConnectionState,
	useConnect,
	useLeap,
	ConnectionState,
} from '@onehop/react';
import {pipe} from '@onehop/client';
import {useEffect, useRef} from 'react';
import {useObservableMapGet} from '@onehop/react/src/hooks/maps';

const projectId = 'project_Mjg2MjczMDQzMjY4Njg5OTU';
const room = 'pipe_room_MzI1NDQwNDA2MjY2NTUyMzg';
const joinToken =
	'prjt_c18yZjgyMjY3ZDAwNTllOTQ0MTkyYjNmNzU3OTZmYmI3Zl8zMjU0NDA0MDYyNjY1NTIzNw';

export function Main() {
	const leap = useLeap();
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const connect = useConnect();
	const stream = useObservableMapGet(leap.getRoomStateMap(), room);
	const connectionState = useConnectionState();

	useEffect(() => {
		if (
			!videoRef.current ||
			stream?.subscription !== 'available' ||
			!stream.connection.llhls?.edge_endpoint
		) {
			return;
		}

		console.log('mount');

		const controls = pipe.mount(
			videoRef.current,
			stream.connection.llhls.edge_endpoint,
		);

		return () => {
			controls.destroy();
		};
	}, [stream, connectionState, videoRef.current]);

	return (
		<>
			<pre>{JSON.stringify(stream, null, 4)}</pre>

			<button
				disabled={stream?.subscription === 'available'}
				onClick={() => {
					if (connectionState === ConnectionState.CONNECTED) {
						leap.subscribeToPipeRoom(room, joinToken);
					} else {
						connect({projectId});
					}
				}}
			>
				{connectionState === ConnectionState.CONNECTED
					? 'subscribe'
					: 'connect'}
			</button>

			<video ref={videoRef} />
		</>
	);
}
