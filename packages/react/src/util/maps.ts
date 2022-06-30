import {useEffect, useState} from 'react';

export type ListenerPayload<K, V> =
	| {type: 'clear' | 'merge'}
	| {type: 'set'; key: K; value: V}
	| {type: 'delete'; key: K};

export type Listener<K, V> = (
	instance: ObservableMap<K, V>,
	payload: ListenerPayload<K, V>,
) => unknown;

export function useObservableMap<K, V>(
	map: ObservableMap<K, V>,
	listenOnlyFor?: Array<ListenerPayload<K, V>['type']>,
) {
	const [storeState, setStoreState] = useState({map});

	useEffect(() => {
		const onChange: Listener<K, V> = (instance, payload) => {
			if (listenOnlyFor && !listenOnlyFor.includes(payload.type)) {
				return;
			}

			setStoreState({map});
		};

		map.addListener(onChange);

		return () => {
			map.removeListener(onChange);
		};
	}, [map]);

	return storeState.map;
}

export function useObservableMapGet<K, V>(map: ObservableMap<K, V>, key: K) {
	const [storeState, setStoreState] = useState(() => map.get(key));

	useEffect(() => {
		const onChange: Listener<K, V> = (instance, payload) => {
			if ('key' in payload) {
				setStoreState(map.get(key));
			}
		};

		map.addListener(onChange);

		return () => {
			map.removeListener(onChange);
		};
	}, [key, map]);

	return storeState;
}

export class ObservableMap<K, V> implements Map<K, V> {
	private map = new Map<K, V>();
	private readonly listeners = new Set<Listener<K, V>>();

	get size(): number {
		return this.map.size;
	}

	get [Symbol.toStringTag](): string {
		return 'ObservableMap';
	}

	clear(): void {
		this.map.clear();
		this.notify({type: 'clear'});
	}

	delete(key: K): boolean {
		const success = this.map.delete(key);
		this.notify({type: 'delete', key});

		return success;
	}

	forEach(
		callbackfn: (value: V, key: K, map: Map<K, V>) => void,
		thisArg?: any,
	): void {
		return this.map.forEach(callbackfn, thisArg);
	}

	get(key: K): V | undefined {
		return this.map.get(key);
	}

	has(key: K): boolean {
		return this.map.has(key);
	}

	set(key: K, value: V): this {
		this.map.set(key, value);
		this.notify({type: 'set', key, value});

		return this;
	}

	merge(map: Map<K, V>) {
		this.map = new Map([...this.map, ...map]);
		this.notify({type: 'merge'});
	}

	entries(): IterableIterator<[K, V]> {
		return this.map.entries();
	}

	keys(): IterableIterator<K> {
		return this.map.keys();
	}

	values(): IterableIterator<V> {
		return this.map.values();
	}

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.map[Symbol.iterator]();
	}

	addListener(listener: Listener<K, V>) {
		this.listeners.add(listener);
	}

	removeListener(listener: Listener<K, V>) {
		this.listeners.delete(listener);
	}

	private notify(payload: ListenerPayload<K, V>) {
		for (const listener of this.listeners) {
			listener(this, payload);
		}
	}
}
