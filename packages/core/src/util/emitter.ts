export type SakutaListener<
	P extends Record<string, unknown>,
	Key extends keyof P,
> = (event: SakutaEvent<P, Key>) => unknown;

export class Sakuta<Payloads extends Record<string, unknown>> {
	private readonly listeners;

	public constructor() {
		this.listeners = new Map<
			keyof Payloads,
			Array<SakutaListener<Payloads, keyof Payloads>>
		>();
	}

	public on<K extends keyof Payloads>(
		key: K,
		listener: SakutaListener<Payloads, K>,
	) {
		const existing = this.listeners.get(key) ?? [];
		const merged = [...existing, listener] as Array<
			SakutaListener<Payloads, keyof Payloads>
		>;

		this.listeners.set(key, merged);
	}

	public off<K extends keyof Payloads>(
		key: K,
		listener: SakutaListener<Payloads, K>,
	) {
		const list = this.listeners.get(key);

		if (!list) {
			throw new Error("Cannot remove listener for key that doesn't exist.");
		}

		if (list.length === 0) {
			this.listeners.delete(key);
			return;
		}

		this.listeners.set(
			key,
			list.filter(item => item !== listener),
		);
	}

	protected emit<K extends keyof Payloads>(key: K, data: Payloads[K]) {
		const listeners = this.listeners.get(key);

		if (!listeners) {
			return;
		}

		// In theory, shouldn't happen because we should have already checked
		// in the .off call
		if (listeners.length === 0) {
			this.listeners.delete(key);
			return;
		}

		const event = new SakutaEvent(this, key, data);

		for (const listener of listeners) {
			listener(event);
		}
	}
}

export class SakutaEvent<P extends Record<string, unknown>, K extends keyof P> {
	public readonly instance: Sakuta<P>;
	public readonly key: K;
	public readonly data: P[K];

	constructor(instance: Sakuta<P>, key: K, data: P[K]) {
		this.instance = instance;
		this.key = key;
		this.data = data;
	}
}
