export type HopEmitterListener<
	P extends Record<string, unknown>,
	Key extends keyof P,
> = (event: P[Key]) => unknown;

export type Unsubscribe = () => void;

export class HopEmitter<Payloads extends Record<string, unknown>> {
	private readonly listeners;

	protected constructor() {
		this.listeners = new Map<
			keyof Payloads,
			Set<HopEmitterListener<Payloads, keyof Payloads>>
		>();
	}

	public createListener<K extends keyof Payloads>(
		_key: K,
		fn: HopEmitterListener<Payloads, K>,
	) {
		return fn;
	}

	/**
	 * Subscribe and listen to an event
	 * @param key The event name to listen for
	 * @param listener A listener for this event
	 * @returns A function that can be called to unsubscribe the listener
	 * @example
	 * ```
	 * const unsubscribe = client.on('MESSAGE', console.log);
	 * // Unsubscribe later...
	 * unsubscribe();
	 * ```
	 */
	public on<K extends keyof Payloads>(
		key: K,
		listener: HopEmitterListener<Payloads, K>,
	): Unsubscribe {
		const existing = this.listeners.get(key) ?? [];

		const merged = new Set([...existing, listener]) as Set<
			HopEmitterListener<Payloads, keyof Payloads>
		>;

		this.listeners.set(key, merged);

		return () => {
			const set = this.listeners.get(key);

			if (!set) {
				return;
			}

			if (set.size === 0) {
				this.listeners.delete(key);
			}

			set.delete(listener as HopEmitterListener<Payloads, keyof Payloads>);
		};
	}

	/**
	 * Subscribe and listen to an event once only
	 * @param key The event name to listen for
	 * @param listener A listener for this event
	 * @returns A function that can be called to unsubscribe the listener before it even runs
	 */
	public once<K extends keyof Payloads>(
		key: K,
		listener: HopEmitterListener<Payloads, K>,
	): Unsubscribe {
		const unsubscribe = this.on(key, data => {
			unsubscribe();

			return listener(data);
		});

		return unsubscribe;
	}

	/**
	 * Remove a listener from an event
	 * @param key The event name to remove a listener from
	 * @param listener The listener to remove
	 */
	public off<K extends keyof Payloads>(
		key: K,
		listener: HopEmitterListener<Payloads, K>,
	) {
		const set = this.listeners.get(key);

		if (!set) {
			throw new Error("Cannot remove listener for key that doesn't exist.");
		}

		if (set.size === 0) {
			this.listeners.delete(key);
			return;
		}

		set.delete(listener as HopEmitterListener<Payloads, keyof Payloads>);
	}

	/**
	 * Emit an event to all listeners
	 * @param key The event name to emit
	 * @param data The data to emit
	 */
	emit<K extends keyof Payloads>(key: K, data: Payloads[K]) {
		const listeners = this.listeners.get(key);

		if (!listeners) {
			return;
		}

		// In theory, shouldn't happen because we should have already checked
		// in the .off call
		if (listeners.size === 0) {
			this.listeners.delete(key);
			return;
		}

		for (const listener of listeners) {
			listener(data);
		}
	}
}

class HopEmitterInitialiser extends HopEmitter<never> {
	public static create = <D extends Record<string, unknown>>() =>
		new HopEmitter<D>();
}

export const {create} = HopEmitterInitialiser;
