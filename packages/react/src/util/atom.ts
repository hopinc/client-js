export type AtomValue<T> = {value: T} | {uninitialized: true; value: undefined};
export type Listener<T> = (value: T) => unknown;

export const atom = <T>(initialValue?: T) => {
	let atomValue: AtomValue<T> =
		initialValue === undefined
			? {uninitialized: true, value: undefined}
			: {value: initialValue};

	const listeners = new Set<Listener<T>>();

	const notify = () => {
		if ('uninitialized' in atomValue) {
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
			notify();
			atomValue = {value};
		},

		addListener(listener: Listener<T>) {
			listeners.add(listener);
		},

		removeListener(listener: Listener<T>) {
			listeners.delete(listener);
		},
	};
};
