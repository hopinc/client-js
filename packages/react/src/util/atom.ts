import {useEffect, useState} from 'react';

export type AtomValue<T> = {value: T} | {uninitialized: true; value: undefined};
export type Listener<T> = (value: T) => unknown;

export interface Atom<T> {
	get(): T;
	set(value: T): void;
	addListener(listener: Listener<T>): void;
	removeListener(listener: Listener<T>): void;
}

export function useAtom<T>(atom: Atom<T>) {
	const [value, setValue] = useState({atom});

	useEffect(() => {
		const listener = () => {
			setValue({atom});
		};

		atom.addListener(listener);

		return () => {
			atom.removeListener(listener);
		};
	}, [atom]);

	return value.atom.get();
}

export const atom = <T>(initialValue?: T): Atom<T> => {
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
			atomValue = {value};
			notify();
		},

		addListener(listener: Listener<T>) {
			listeners.add(listener);
		},

		removeListener(listener: Listener<T>) {
			listeners.delete(listener);
		},
	};
};

const count = atom(0);

count.get();
