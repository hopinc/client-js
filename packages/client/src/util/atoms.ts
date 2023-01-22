import type {Unsubscribe} from '../util/types';

export type Listener<T> = (value: T) => void;

export type AtomValue<T> =
	| {uninitialized?: never; value: T}
	| {uninitialized: true; value: undefined};

export type Atom<T> = {
	get(): T;
	set(value: T): void;
	addListener(listener: Listener<T>): Unsubscribe;
	removeListener(listener: Listener<T>): void;
};

export type Infer<T> = T extends Atom<infer V> ? V : never;

/**
 * An atom, inspired much by Jotai, is a single bit of readible
 * state that can be observed and written to. It's useful for
 * React as we can easily update state when the atom changes
 * and use it as a shared global state store.
 *
 * @param initialValue An initial value to assign to the atom
 * @returns A readible and observable state object
 */
function atom<T>(initialValue?: T): Atom<T> {
	let atomValue: AtomValue<T> =
		initialValue === undefined
			? {uninitialized: true, value: undefined}
			: {value: initialValue};

	const listeners = new Set<Listener<T>>();

	const notify = () => {
		if ('uninitialized' in atomValue) {
			// In theory this would never happen
			// because the value would have
			// already been set and therefore
			// not unintialized
			return;
		}

		for (const listener of listeners) {
			listener(atomValue.value);
		}
	};

	return {
		get() {
			if ('uninitialized' in atomValue) {
				throw new Error(
					'Cannot read the value of an atom that has no value yet.',
				);
			}

			return atomValue.value;
		},

		set(value: T) {
			// Be efficient and don't update
			if (Object.is(atomValue.value, value)) {
				return;
			}

			atomValue = {value};
			notify();
		},

		addListener(listener: Listener<T>) {
			listeners.add(listener);

			return () => {
				listeners.delete(listener);
			};
		},

		removeListener(listener: Listener<T>) {
			listeners.delete(listener);
		},
	};
}

export {atom as create};
