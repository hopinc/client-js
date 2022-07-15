import {
	useConnectionState,
	useConnect,
	useLeap,
	ConnectionState,
} from '@onehop/react';
import {pipe} from '@onehop/client';
import {useEffect, useRef, useState} from 'react';
import {useObservableMapGet} from '@onehop/react/src/hooks/maps';
import {Controls} from '@onehop/client/src/pipe';

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
	const [controls, setControls] = useState<Controls | null>(null);

	useEffect(() => {
		if (
			!videoRef.current ||
			stream?.subscription !== 'available' ||
			!stream.connection.llhls?.edge_endpoint
		) {
			return;
		}

		const controls = pipe.mount(
			videoRef.current,
			stream.connection.llhls.edge_endpoint,
		);

		setControls(controls);

		return () => {
			controls.destroy();
		};
	}, [stream, connectionState, videoRef.current]);

	return (
		<>
			<pre>
				{JSON.stringify(
					{
						stream,
						connectionState,
						has_connection:
							stream?.subscription === 'available' &&
							Boolean(stream.connection.llhls),
					},
					null,
					4,
				)}
			</pre>

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
					? stream?.subscription === 'available'
						? 'subscribed'
						: 'subscribe'
					: 'connect'}
			</button>
			{controls && <button onClick={controls.play}>play</button>}
			<video ref={videoRef} />
		</>
	);
}
