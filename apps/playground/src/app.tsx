import {
	useClientContext,
	useReadChannelState,
	useClientConnectionState,
} from '@onehop/react/src/hooks/channels';
import {useState} from 'react';
import {LeapConnectionState} from '@onehop/leap-edge-js';
import {Hop} from '@onehop/js';

function Main() {
	const state = useReadChannelState('channel_MjY4NTU2NDgwMjc1MjEwMjY');

	return (
		<div>
			<pre>{JSON.stringify(state, null, 4)}</pre>
		</div>
	);
}

const project = 'project_MTc2Mzc5ODU1ODIxMDg2NzM';

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
