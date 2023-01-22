import type {util} from '@onehop/client';
import {useEffect, useState} from 'react';

export function useObservableMap<K, V extends object>(
	map: util.maps.ObservableMap<K, V>,
	listenOnlyFor?: Array<util.maps.ListenerPayload<K, V>['type']>,
) {
	const [storeState, setStoreState] = useState({map});

	useEffect(() => {
		const unsubscribe = map.addListener((instance, payload) => {
			if (listenOnlyFor && !listenOnlyFor.includes(payload.type)) {
				return;
			}

			setStoreState({map});
		});

		return () => {
			unsubscribe();
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
		if (!key) {
			return;
		}

		const unsubscribe = map.addListener((instance, payload) => {
			if (
				('key' in payload && payload.key === key) ||
				(key && payload.type === 'merge')
			) {
				setStoreState(map.get(key));
			} else if (payload.type === 'clear') {
				setStoreState(undefined);
			}
		});

		return () => {
			unsubscribe();
		};
	}, [key, map]);

	return storeState;
}

export function useObserveObservableMap<K, V extends object>(
	map: util.maps.ObservableMap<K, V>,
	listener: (map: util.maps.ObservableMap<K, V>) => unknown,
) {
	useEffect(() => {
		const unsubscribe = map.addListener(listener);

		return () => {
			unsubscribe();
		};
	}, [map]);
}
