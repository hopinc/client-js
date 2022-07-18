import {hop} from '@onehop/client';
import {useRef} from 'react';
import {usePipeRoom} from '@onehop/react/src/hooks/pipe';

const projectId = 'project_MzMwMzI3NzAyMTcxNTY2MTc';
const joinToken =
	'prjt_c180ZDhiMjAxNWE3NDI4NTE4MWEyODc4NWQ3YmRhMmUxOV8zMzAzMjgxMTAwMjU2ODcxNQ';

hop.init({projectId});

export function Main() {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const room = usePipeRoom({
		joinToken,
		ref: videoRef,
	});

	return (
		<>
			<pre>
				{JSON.stringify(
					{canPlay: room.canPlay, subscription: room.subscription},
					null,
					4,
				)}
			</pre>

			<button disabled={!room.canPlay} onClick={() => videoRef.current?.play()}>
				play
			</button>

			<video ref={videoRef} />
		</>
	);
}
