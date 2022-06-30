import {
	useClientContext,
	useReadChannelState,
	useClientConnectionState,
	useChannelMessage,
} from '@onehop/react/src/hooks/channels';
import {useCallback, useState} from 'react';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {Hop} from '@onehop/js';

const project = 'project_MTc2Mzc5ODU1ODIxMDg2NzM';
const channel = 'channel_MjY4NTU2NDgwMjc1MjEwMjY';

function Main() {
	const state = useReadChannelState(channel);

	const [messages, setMessage] = useState<string[]>([]);

	useChannelMessage<{message: string}>(
		channel,
		'MESSAGE',
		useCallback(data => {
			setMessage(old => [...old, data.message]);
		}, []),
	);

	return (
		<div>
			<pre>{JSON.stringify({state, messages}, null, 4)}</pre>
		</div>
	);
}

export default function App() {
	const client = useClientContext();
	const state = useClientConnectionState();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<unknown>(null);

	const getToken = async () => {
		setLoading(true);

		const hop = new Hop(
			'bearer_c19lNDFmODVkNDRjYmY3ZWJjZGFhMTE0ZTM0YWYzMWIwYl8xMjg4MDU3NzYyMjUzMjA5OQ',
			'https://api-staging.hop.io',
		);

		try {
			const {id: token} = await hop.channels.tokens.create(
				{id: 'bruh'},
				project,
			);

			client.connect({
				projectId: project,
				token,
			});
		} catch (error: unknown) {
			setError(error);
		} finally {
			setLoading(false);
		}
	};

	if (state === LeapConnectionState.CONNECTED) {
		return <Main />;
	}

	return (
		<>
			<h1>State: {state ?? 'n/a'}</h1>

			{error && <pre>{JSON.stringify(error, null, 2)}</pre>}

			{state === null && (
				<button disabled={loading} type="button" onClick={getToken}>
					{loading ? 'Loading...' : 'Get Token'}
				</button>
			)}
		</>
	);
}
