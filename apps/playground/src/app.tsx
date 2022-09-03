import {hop} from '@onehop/client';
import {useChannelMessage, useReadChannelState} from '@onehop/react';
import {useEffect} from 'react';

const projectId = 'project_MjcxMjgyNDEyMDc2MjM3NDE';

export function Main() {
	// useChannelMessage('project_NDc4MjU3NTE1MTE3MzYzMjE', 'ABC', console.log);
	const t = useReadChannelState('test4');
	useChannelMessage('test4', 'TEST', console.log);

	console.log(t);

	useEffect(() => {
		hop.init({
			projectId,
			token: null,
		});
	}, []);

	return <div>hi</div>;
}
