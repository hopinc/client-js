import {
	useChannelMessage,
	useConnectionState,
	useReadChannelState,
} from '@onehop/react';
import {useState} from 'react';

export default function Index() {
	const channel = useReadChannelState('isla');
	const connection = useConnectionState();

	const [message, setMessage] = useState<string | null>(null);

	useChannelMessage<{message: string}>('isla', 'MESSAGE', data => {
		setMessage(data.message);
	});

	return <pre>{JSON.stringify({channel, connection, message}, null, 4)}</pre>;
}
