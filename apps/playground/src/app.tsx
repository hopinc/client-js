import {hop} from '@onehop/client';
import {useEffect, useRef} from 'react';
import {usePipeRoom} from '@onehop/react/src/hooks/pipe';

const projectId = 'project_MzMwMzI3NzAyMTcxNTY2MTc';
const joinToken =
	'prjt_c184OWUxYzhjMjcyOGEwMjVjY2Y5MzcyZTZjM2YwYjQ0OF8zMjUzNzY4NzQwNTgzODM0MQ';

hop.init({
	projectId,
});

export function Main() {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const room = usePipeRoom({
		joinToken,
		ref: videoRef,
	});

	useEffect(() => {
		const unsubscribe = room.events.on('STREAM_LIVE', event => {
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
