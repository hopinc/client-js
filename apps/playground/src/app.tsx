import {hop} from '@onehop/client';
import {useEffect, useRef} from 'react';
import {usePipeRoom} from '@onehop/react/src/hooks/pipe';
import {ConnectionState, useConnectionState} from '@onehop/react';

const projectId = 'project_MzMwMzI3NzAyMTcxNTY2MTc';
const joinToken =
	'prjt_c180ZDhiMjAxNWE3NDI4NTE4MWEyODc4NWQ3YmRhMmUxOV8zMzAzMjgxMTAwMjU2ODcxNQ';

const c = hop.init({projectId});

export function Main() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const connectionState = useConnectionState();

	const room = usePipeRoom({
		joinToken,
		ref: videoRef,
	});

	useEffect(() => {
		if (connectionState !== ConnectionState.CONNECTED) {
			return;
		}

		room.join();
	}, [connectionState]);

	return (
		<>
			<pre>{JSON.stringify(room, null, 4)}</pre>

			<button disabled={!room.canPlay} onClick={room.controls?.play}>
				play
			</button>

			<video ref={videoRef} />
		</>
	);
}
