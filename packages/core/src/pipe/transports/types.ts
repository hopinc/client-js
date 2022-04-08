export type TransportType = 'rtc' | 'hls';

export interface TransportInstance {
	play(): void;
	pause(): void;
	disconnect(): void;
}

export interface Transport {
	mount(node: HTMLVideoElement): TransportInstance;
}
