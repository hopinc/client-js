export type Listener<T> = (value: T) => unknown;

export type Subscription = {
	remove(): void;
};
