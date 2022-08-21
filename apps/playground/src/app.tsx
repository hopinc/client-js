import {hop} from '@onehop/client';
import {useChannelMessage} from '@onehop/react';
import {useEffect} from 'react';

const projectId = 'project_Mjg2MjczMDQzMjY4Njg5OTU';

export function Main() {
	useChannelMessage('messages', 'MESSAGE_CREATE', console.log);

	useEffect(() => {
		hop.init({
			projectId,
		});
	}, []);

	return <div>hi</div>;
}
