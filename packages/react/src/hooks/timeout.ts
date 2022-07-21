import {useEffect} from 'react';

export function useInterval(ms: number, fn: () => unknown) {
	useEffect(() => {
		const interval = setInterval(fn, ms);

		return () => {
			clearInterval(interval);
		};
	}, []);
}
