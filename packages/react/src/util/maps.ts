import {useEffect, useState} from 'react';

export type Listener<K, V> = (
	instance: ObservableMap<K, V>,
	key: K,
	value: V,
) => unknown;

export function useObservableMap<K, V>(map: ObservableMap<K, V>) {
	const [storeState, setStoreState] = useState({map});

	useEffect(() => {
		const onChange: Listener<K, V> = (_, key, value) => {
			setStoreState({map});
		};

		map.addListener(onChange);

		return () => {
			map.removeListener(onChange);
		};
	}, []);

	return storeState.map;
}

export class ObservableMap<K, V> implements Map<K, V> {
	private readonly map = new Map<K, V>();
	private readonly listeners = new Set<Listener<K, V>>();

	get size(): number {
		return this.map.size;
	}

	get [Symbol.toStringTag](): string {
		return 'ObservableMap';
	}

	clear(): void {
		this.map.clear();
	}

	delete(key: K): boolean {
		return this.map.delete(key);
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

		for (const listener of this.listeners) {
			listener(this, key, value);
		}

		return this;
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
}
