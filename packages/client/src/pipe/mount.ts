import Hls, {HlsConfig} from 'hls.js';

const LIVE_LLHLS_SYNC_BCE = 3;

const defaultConfig: Partial<HlsConfig> = {
	lowLatencyMode: true,
	backBufferLength: 10,
	autoStartLoad: true,
	enableWorker: true,
	liveBackBufferLength: 5,
	abrBandWidthFactor: 1,
};

export class Controls {
	private readonly node;
	private readonly _hls;

	public constructor(node: HTMLVideoElement, hls?: Hls) {
		this.node = node;
		this._hls = hls;
	}

	/**
	 * Syncs to live edge
	 *
	 * @param distance The seconds to sync from live edge (e.g. a buffer)
	 */
	sync(distance = 0) {
		this.node.currentTime = this.node.duration - distance;
	}

	async stop() {
		this.node.pause();
	}

	async play() {
		await this.node.play();
	}

	get isPaused() {
		return this.node.paused;
	}

	destroy() {
		this.hls.destroy();
	}

	get hls() {
		if (!this._hls) {
			throw new Error(
				'Cannot get HLS instance as video is being streamed natively.',
			);
		}

		return this._hls;
	}
}

export function mount(
	node: HTMLVideoElement,
	url: string,
	hlsConfigOverride?: Partial<HlsConfig>,
): Controls {
	if (!Hls.isSupported()) {
		throw new Error('HLS Will not work in this browser', {
			cause: new Error(
				'This browser does not support MSE: https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API',
			),
		});
	}

	node.onplay = () => {
		node.currentTime = node.duration - LIVE_LLHLS_SYNC_BCE;
	};

	const instance = new Hls({
		...defaultConfig,
		...hlsConfigOverride,
	});

	instance.loadSource(url);
	instance.attachMedia(node);

	return new Controls(node, instance);
}
