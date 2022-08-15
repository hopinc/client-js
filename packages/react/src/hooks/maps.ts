import {util} from '@onehop/client';
import {useState, useEffect} from 'react';

export function useObservableMap<K, V extends object>(
	map: util.maps.ObservableMap<K, V>,
	listenOnlyFor?: Array<util.maps.ListenerPayload<K, V>['type']>,
) {
	const [storeState, setStoreState] = useState({map});

	useEffect(() => {
		const listening = map.addListener((instance, payload) => {
			if (listenOnlyFor && !listenOnlyFor.includes(payload.type)) {
				return;
			}

			setStoreState({map});
		});

		return () => {
			listening.remove();
		};
	}, [map]);

	return storeState.map;
}

export function useObservableMapGet<K, V extends object>(
	map: util.maps.ObservableMap<K, V>,
	key: K | undefined,
) {
	const [storeState, setStoreState] = useState(() =>
		key ? map.get(key) : undefined,
	);

	useEffect(() => {
		const subscription = map.addListener((instance, payload) => {
			if ('key' in payload && payload.key === key) {
				setStoreState(map.get(key));
			} else if (payload.type === 'clear') {
				setStoreState(undefined);
			}
		});

		return () => {
			subscription.remove();
		};
	}, [key, map]);

	return storeState;
}

export function useObserveObservableMap<K, V extends object>(
	map: util.maps.ObservableMap<K, V>,
	listener: (map: util.maps.ObservableMap<K, V>) => unknown,
) {
	useEffect(() => {
		const subscription = map.addListener(listener);

		return () => {
			subscription.remove();
		};
	}, [map]);
}
