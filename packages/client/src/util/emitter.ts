/* eslint-disable @typescript-eslint/parameter-properties */

export type HopEmitterListener<
	P extends Record<string, unknown>,
	Key extends keyof P,
> = (event: HopEmitterEvent<P, Key>) => unknown;

export class HopEmitter<Payloads extends Record<string, unknown>> {
	private readonly listeners;

	protected constructor() {
		this.listeners = new Map<
			keyof Payloads,
			Array<HopEmitterListener<Payloads, keyof Payloads>>
		>();
	}

	public createListener<K extends keyof Payloads>(
		key: K,
		fn: HopEmitterListener<Payloads, K>,
	) {
		return fn;
	}

	public on<K extends keyof Payloads>(
		key: K,
		listener: HopEmitterListener<Payloads, K>,
	) {
		const existing = this.listeners.get(key) ?? [];
		const merged = [...existing, listener] as Array<
			HopEmitterListener<Payloads, keyof Payloads>
		>;

		this.listeners.set(key, merged);
	}

	public off<K extends keyof Payloads>(
		key: K,
		listener: HopEmitterListener<Payloads, K>,
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

	emit<K extends keyof Payloads>(key: K, data: Payloads[K]) {
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

		const event = new HopEmitterEvent(this, key, data);

		for (const listener of listeners) {
			listener(event);
		}
	}
}

class HopEmitterInitialiser<
	P extends Record<string, unknown>,
> extends HopEmitter<P> {
	public static create = <D extends Record<string, unknown>>() =>
		new HopEmitter<D>();

	private constructor() {
		super();
	}
}

export function create<Payloads extends Record<string, unknown>>() {
	return HopEmitterInitialiser.create<Payloads>();
}

export class HopEmitterEvent<
	P extends Record<string, unknown>,
	K extends keyof P,
> {
	public readonly emitter: HopEmitter<P>;
	public readonly key: K;
	public readonly data: P[K];

	constructor(emitter: HopEmitter<P>, key: K, data: P[K]) {
		this.emitter = emitter;
		this.key = key;
		this.data = data;
	}
}
