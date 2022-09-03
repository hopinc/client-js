import {hop} from '@onehop/client';
import {useChannelMessage, useReadChannelState} from '@onehop/react';
import {useEffect} from 'react';

const projectId = 'project_MjcxMDk5Nzg1MTM1MDYzMTA';

export function Main() {
	// useChannelMessage('project_NDc4MjU3NTE1MTE3MzYzMjE', 'ABC', console.log);
	const t = useReadChannelState('game-47EA');

	console.log(t);

	useEffect(() => {
		hop.init({
			projectId,
			token:
				'leap_token_c183Nzc5ZWI0ZGUyZmFlMmFkNDgyMTRlM2MwOWRlMjU4N181MDcxNDUxNzY0Mjk2OTE0NA',
		});
	}, []);

	return <div>hi</div>;
}
