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

		controls.sync();
	};

	return (
		<div>
			<button onClick={click}>play</button>
			<video ref={ref} />
		</div>
	);
}
