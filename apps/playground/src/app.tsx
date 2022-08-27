import {hop} from '@onehop/client';
import {useChannelMessage} from '@onehop/react';
import {useEffect} from 'react';

const projectId = 'project_MzA0MDgwOTQ2MDEwODQ5NzQ';

export function Main() {
	useChannelMessage('project_NDc4MjU3NTE1MTE3MzYzMjE', 'ABC', console.log);

	useEffect(() => {
		hop.init({
			projectId,
			token: null,
		});
	}, []);

	return <div>hi</div>;
}
