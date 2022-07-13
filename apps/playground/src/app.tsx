import {useChannels} from '@onehop/react';

const token =
	'leap_token_c183NzYwODg0Y2Y2ZGRhNzJlMjUzMjkxZDU2NmJjYjVmMl8zMTU0MDI5ODMzNjc2MDEwNQ';

const projectId = 'project_MzA0MDgwOTQ2MDEwODQ5NzQ';

export function Main() {
	const channels = useChannels();

	const connect = () => {
		channels.connect({
			projectId,
			token,
		});
	};

	return (
		<>
			<button onClick={connect}>connect</button>
		</>
	);
}
