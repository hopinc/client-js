import type {HlsConfig} from 'hls.js';
import Hls from 'hls.js';

export const APPLE_HLS_MIME = 'application/vnd.apple.mpegurl';
export const LIVE_LLHLS_SYNC_BCE = 3;
export const WCL_DELAY_LES = 5;

const defaultConfig: Partial<HlsConfig> = {
	lowLatencyMode: true,
	backBufferLength: 10,
	autoStartLoad: true,
	enableWorker: true,
	abrBandWidthFactor: 1,
	liveSyncDuration: LIVE_LLHLS_SYNC_BCE,
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
	sync(distance = LIVE_LLHLS_SYNC_BCE) {
		this.node.currentTime = this.node.duration - distance;
	}

	async stop() {
		this.node.pause();
	}

	async play() {
		await this.node.play();
		this.sync(3.5);
	}

	get isPaused() {
		return this.node.paused;
	}

	destroy() {
		this.hls.destroy();
	}

	get isNative() {
		return !this._hls;
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
	let instance: Hls;

	if (Hls.isSupported()) {
		instance = new Hls({
			...defaultConfig,
			...hlsConfigOverride,
		});
	} else if (node.canPlayType(APPLE_HLS_MIME)) {
		node.src = url;
		return new Controls(node);
	} else {
		throw new Error('HLS Will not work in this browser', {
			cause: new Error(
				'This browser does not support HLS or MSE: https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API',
			),
		});
	}

	const syncToBCE = () => {
		if (node.duration < LIVE_LLHLS_SYNC_BCE) {
			return;
		}

		node.currentTime = node.duration - LIVE_LLHLS_SYNC_BCE;
	};

	node.onplay = () => {
		syncToBCE();
	};

	const liveSync = setInterval(() => {
		if (
			node &&
			!node.paused &&
			instance.latency > LIVE_LLHLS_SYNC_BCE + WCL_DELAY_LES
		) {
			syncToBCE();
		}
	}, 1000);

	instance.on(Hls.Events.MEDIA_DETACHING, () => {
		clearInterval(liveSync);
	});

	instance.loadSource(url);
	instance.attachMedia(node);

	return new Controls(node, instance);
}
