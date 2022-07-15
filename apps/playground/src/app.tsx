import {useConnect} from '@onehop/react';

const projectId = 'project_MzA0MDgwOTQ2MDEwODQ5NzQ';

export function Main() {
	const connect = useConnect();

	return (
		<>
			<button
				onClick={() => {
					connect({projectId});
				}}
			>
				connect
			</button>
		</>
	);
}
