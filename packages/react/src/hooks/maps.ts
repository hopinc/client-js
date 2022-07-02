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
