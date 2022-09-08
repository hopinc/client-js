export type Queue<T> = {
	enqueue(item: T): void;
	dequeue(): T | undefined;
	peek(): T | undefined;
	get length(): number;
	isEmpty(): boolean;
};

/**
 * A queue that can be used to store items in a first-in-first-out order.
 */
export class FIFOQueue<T> implements Queue<T> {
	private readonly items: T[] = [];

	public enqueue(item: T) {
		this.items.push(item);
	}

	public dequeue(): T | undefined {
		return this.items.shift();
	}

	public peek(): T | undefined {
		return this.items[0];
	}

	public get length() {
		return this.items.length;
	}

	public isEmpty() {
		return this.items.length === 0;
	}
}

/**
 * A queue that can be used to store items in a last-in-first-out order.
 */
export class LIFOQueue<T> implements Queue<T> {
	private readonly items: T[] = [];

	public enqueue(item: T) {
		this.items.push(item);
	}

	public dequeue(): T | undefined {
		return this.items.pop();
	}

	public peek(): T | undefined {
		return this.items[this.items.length - 1];
	}

	public get length() {
		return this.items.length;
	}

	public isEmpty() {
		return this.items.length === 0;
	}
}
