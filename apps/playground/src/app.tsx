import {
	useConnectionState,
	useConnect,
	useLeap,
	ConnectionState,
} from '@onehop/react';
import {pipe} from '@onehop/client';
import {useEffect, useRef, useState} from 'react';
import {usePipeRoom} from '@onehop/react/src/hooks/pipe';

const projectId = 'project_Mjg2MjczMDQzMjY4Njg5OTU';
const roomId = 'pipe_room_MzI1NDQwNDA2MjY2NTUyMzg';
const joinToken =
	'prjt_c18yZjgyMjY3ZDAwNTllOTQ0MTkyYjNmNzU3OTZmYmI3Zl8zMjU0NDA0MDYyNjY1NTIzNw';

export function Main() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const leap = useLeap();

	const controls = usePipeRoom({
		joinToken,
		ref: videoRef,
	});

	useEffect(() => {
		controls.join();
	}, []);

	return (
		<>
			{controls && <button onClick={controls.play}>play</button>}
			<button
				onClick={() => {
					leap.connect({projectId});
				}}
			>
				connect
			</button>

			{controls && <button onClick={async () => controls.play()}>play</button>}

			<video ref={videoRef} />
		</>
	);
}
