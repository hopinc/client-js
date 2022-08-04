import {hop} from '@onehop/client';
import {useEffect, useRef} from 'react';
import {usePipeRoom} from '@onehop/react';

const projectId = 'project_MzMwMzI3NzAyMTcxNTY2MTc';
const joinToken =
	'prjt_c18yYzY5ZmJjMTRhOWM3MmIzZDVjYTViYTc1YWJkYjRhNl8zMzY4MTU2MzU2NTEyOTcyOQ';

hop.init({projectId});

export function Main() {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const room = usePipeRoom({
		joinToken,
		ref: videoRef,
	});

	useEffect(() => {
		const unsubscribe = room.events.on('ROOM_UPDATE', event => {
			console.log(event.data.id, 'is now live');
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return (
		<>
			<pre>
				{JSON.stringify(
					{
						live: room.live,
						canPlay: room.canPlay,
						buffering: room.buffering,
						subscription: room.subscription,
					},
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
