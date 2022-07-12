import {mount} from '@onehop/client/src/pipe';
import {useRef} from 'react';

export function Main() {
	const ref = useRef<HTMLVideoElement | null>(null);

	const click = async () => {
		if (!ref.current) {
			return;
		}

		const controls = mount(
			ref.current,
			'https://ove.deploy.hop.io:3334/v.vanilla/pipe_room_phin/llhls.m3u8',
		);

		await ref.current.play();

		controls.sync(0);

		setInterval(() => {
			console.log(
				ref.current!.currentTime,
				ref.current!.duration,
				controls.hls.bandwidthEstimate,
			);
		}, 500);
	};

	return (
		<>
			<video ref={ref} controls />
			<button onClick={click}>play</button>
		</>
	);
}
