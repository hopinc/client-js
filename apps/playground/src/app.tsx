import {hop} from '@onehop/client';
import {useChannelMessage, useReadChannelState} from '@onehop/react';
import {useEffect} from 'react';

const projectId = 'project_MjcxMDk5Nzg1MTM1MDYzMTA';

const instance = hop.init({projectId: '', token: ''});

instance.sendMessage('votes', 'add', 1);
instance.sendMessage('public-chat', 'kashcafe', {
	user: 'Kashall',
	message: 'This is a message!',
});

export function Main() {
	// useChannelMessage('project_NDc4MjU3NTE1MTE3MzYzMjE', 'ABC', console.log);
	const t = useReadChannelState('test');

	console.log(t);

	useEffect(() => {
		hop.init({
			projectId,
		});
	}, []);

	return <div>hi</div>;
}
