import {useCallback, useState} from 'react';

export interface Actions<K, V> {
	set: (key: K, value: V) => void;
	setAll: (entries: Map<K, V>) => void;
	remove: (key: K) => void;
	reset: Map<K, V>['clear'];
}

export function useMap<K, V>(
	initialState: () => Map<K, V> = () => new Map(),
): [Omit<Map<K, V>, 'set' | 'clear' | 'delete'>, Actions<K, V>] {
	const [map, setMap] = useState(initialState);

	const actions: Actions<K, V> = {
		set: useCallback((key, value) => {
			setMap(prev => {
				const copy = new Map(prev);
				copy.set(key, value);
				return copy;
			});
		}, []),

		setAll: useCallback(entries => {
			setMap(() => new Map(entries));
		}, []),

		remove: useCallback(key => {
			setMap(prev => {
				const copy = new Map(prev);
				copy.delete(key);
				return copy;
			});
		}, []),

		reset: useCallback(() => {
			setMap(() => new Map());
		}, []),
	};

	return [map, actions];
}
