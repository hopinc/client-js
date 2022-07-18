import {util} from '@onehop/client';
import {useState, useEffect} from 'react';

export function useObservableMap<K, V>(
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

export function useObservableMapGet<K, V>(
	map: util.maps.ObservableMap<K, V>,
	key: K | undefined,
) {
	const [storeState, setStoreState] = useState(() =>
		key ? map.get(key) : undefined,
	);

	useEffect(() => {
		const onChange: util.maps.Listener<K, V> = (instance, payload) => {
			if ('key' in payload && key) {
				setStoreState(map.get(key));
			} else if (payload.type === 'clear') {
				setStoreState(undefined);
			}
		};

		map.addListener(onChange);

		return () => {
			map.removeListener(onChange);
		};
	}, [key, map]);

	return storeState;
}
