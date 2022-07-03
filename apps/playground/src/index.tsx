import {useChannels, useClientContext, ConnectionState} from '@onehop/react';
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Hop} from '@onehop/js';

import {project, Main} from './app';

function App() {
	const client = useClientContext();
	const state = useChannels();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<unknown>(null);

	const getToken = async () => {
		setLoading(true);

		const hop = new Hop(
			'bearer_c19kODY0YjE5MDBmY2UwYTE3OWM1MzhmZDYxYzczMzkyMF8yNzQ0MDIyMzU3MzEzNTM2MQ',
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

	if (state === ConnectionState.CONNECTED) {
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

createRoot(document.getElementById('root')!).render(<App />);
