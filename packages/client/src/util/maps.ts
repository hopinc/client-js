import {Subscription} from './types';

export type ListenerPayload<K, V> =
	| {type: 'clear' | 'merge'}
	| {type: 'set'; key: K; value: V}
	| {type: 'delete'; key: K};

export type Listener<K, V extends object> = (
	instance: ObservableMap<K, V>,
	payload: ListenerPayload<K, V>,
) => unknown;

export class ObservableMap<K, V extends object> implements Map<K, V> {
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
		this.map.forEach(callbackfn, thisArg);
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

	patch(key: K, value: Partial<V>): this {
		const old = this.map.get(key);

		if (old === undefined) {
			throw new Error(
				'Cannot patch a value that does not already exist. Use `.set` instead.',
			);
		}

		return this.set(key, {
			...old,
			...value,
		});
	}

	/**
	 * Merge with another map, with the new map overwriting members with the same key
	 * @param map A map that has a matching set of keys and values
	 */
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

	addListener(listener: Listener<K, V>): Subscription {
		this.listeners.add(listener);

		return {
			remove: () => {
				this.listeners.delete(listener);
			},
		};
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
