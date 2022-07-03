import {
	useReadChannelState,
	useChannelMessage,
	useSendChannelMessage,
} from '@onehop/react';
import {useCallback, useState} from 'react';

export const project = 'project_MTc2Mzc5ODU1ODIxMDg2NzM';
export const channel = 'channel_MjY4NTU2NDgwMjc1MjEwMjY';

export const event = 'SEND_MESSAGE';
export type SendMessage = {message: string};

function SendMessageComponent() {
	const [message, setMessage] = useState('');

	const send = useSendChannelMessage<SendMessage>(channel, event);

	return (
		<div>
			<form
				onSubmit={e => {
					e.preventDefault();
					send({message});
				}}
			>
				<input
					placeholder="message"
					type="text"
					value={message}
					onChange={e => {
						setMessage(e.target.value);
					}}
				/>

				<button type="submit">Send</button>
			</form>
		</div>
	);
}

function ShowMessagesComponent() {
	const [messages, setMessage] = useState<string[]>([]);

	const handler = useCallback((data: SendMessage) => {
		setMessage(old => [...old, data.message]);
	}, []);

	useChannelMessage(channel, event, handler);

	return <pre>{JSON.stringify({messages})}</pre>;
}

export function Main() {
	const {state, subscription, error} = useReadChannelState(channel);

	return (
		<div>
			<pre>{JSON.stringify({state, error, subscription}, null, 4)}</pre>

			<ShowMessagesComponent />
			<SendMessageComponent />
		</div>
	);
}
