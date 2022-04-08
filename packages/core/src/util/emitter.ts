type Listener<P extends Record<string, unknown>, Key extends keyof P> = (
	event: SakutaEvent<P, Key>,
) => unknown;

export class Sakuta<Payloads extends Record<string, unknown>> {
	private readonly listeners;

	public constructor() {
		this.listeners = new Map<
			keyof Payloads,
			Array<Listener<Payloads, keyof Payloads>>
		>();
	}

	public on<K extends keyof Payloads>(key: K, listener: Listener<Payloads, K>) {
		const existing = this.listeners.get(key) ?? [];
		const merged = [...existing, listener] as Array<
			Listener<Payloads, keyof Payloads>
		>;
		this.listeners.set(key, merged);
	}

	public off<K extends keyof Payloads>(
		key: K,
		listener: Listener<Payloads, K>,
	) {
		const list = this.listeners.get(key);

		if (!list) {
			throw new Error("Cannot remove listener for key that doesn't exist.");
		}

		const filtered = list.filter(item => item !== listener);
		this.listeners.set(key, filtered);
	}

	public emit<K extends keyof Payloads>(key: K, data: Payloads[K]) {
		const listeners = this.listeners.get(key);

		if (!listeners) {
			return;
		}

		for (const listener of listeners) {
			listener(new SakutaEvent(this, key, data));
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
