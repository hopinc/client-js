import {useReadChannelState, useChannelMessage} from '@onehop/react';
import {useCallback, useState} from 'react';

export const project = 'project_MTc2Mzc5ODU1ODIxMDg2NzM';
export const channel = 'channel_MjY4NTU2NDgwMjc1MjEwMjY';

export function Main() {
	const {state, subscription, error} = useReadChannelState(channel);

	const [messages, setMessage] = useState<string[]>([]);

	const handler = useCallback((data: {message: string}) => {
		setMessage(old => [...old, data.message]);
	}, []);

	useChannelMessage(channel, 'SEND_MESSAGE', handler);

	return (
		<div>
			<pre>
				{JSON.stringify({state, error, subscription, messages}, null, 4)}
			</pre>
		</div>
	);
}
