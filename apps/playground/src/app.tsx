import {
	useClientContext,
	useReadChannelState,
} from '@onehop/react/src/hooks/channels';
import {useEffect, useState} from 'react';

function Main() {
	const state = useReadChannelState('abc123');

	return (
		<div>
			<pre>{JSON.stringify(state, null, 4)}</pre>
		</div>
	);
}

export default function App() {
	const [loaded, setLoaded] = useState(false);

	const client = useClientContext();

	useEffect(() => {
		client
			.connect({
				projectId: 'project_MTc2Mzc5ODU1ODIxMDg2NzM',
				token:
					'leap_token_c19kOGJjZTRiMGFlM2Q3YjNmN2FlYzg5MzlkMGFkYjliM18yNTYzNjE3MTYwNDQzOTA0MQ',
			})
			.then(() => setLoaded(true));
	}, []);

	if (loaded) {
		return <Main />;
	}

	return <p>loading</p>;
}
