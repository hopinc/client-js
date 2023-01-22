import {useInit} from '@onehop/react';
import {type AppProps} from 'next/app';

export default function App({Component, pageProps}: AppProps) {
	useInit({
		projectId: 'project_MzMwMzI3NzAyMTcxNTY2MTc',
	});

	return <Component {...pageProps} />;
}
