import {useReadChannelState} from '@onehop/react/src/hooks/channels';
import {createRoot} from 'react-dom/client';

const channel = `channel_dsadsf`;

export default function App() {
	const state = useReadChannelState<{lastMessageTime: number}>(channel);

	return <div>{state.lastMessageTime}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
