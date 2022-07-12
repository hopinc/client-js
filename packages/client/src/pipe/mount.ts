import Hls, {HlsConfig} from 'hls.js';

const APPLE_HLS_MIME = 'application/vnd.apple.mpegurl';

const defaultConfig: Partial<HlsConfig> = {
	lowLatencyMode: true,
	backBufferLength: 5,
	autoStartLoad: true,
	enableWorker: true,
	liveSyncDuration: 0,
	liveBackBufferLength: 5,
};

export class Controls {
	private readonly node;
	private readonly hls;

	public constructor(node: HTMLVideoElement, hls?: Hls) {
		this.node = node;
		this.hls = hls;
	}

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
		this.hls?.destroy();
	}
}

export function mount(
	node: HTMLVideoElement,
	url: string,
	hlsConfigOverride?: Partial<HlsConfig>,
): Controls {
	// Safari supports HLS directly, so we can simply play it here
	// without having to use hls.js (yay!)
	if (node.canPlayType(APPLE_HLS_MIME)) {
		node.src = url;
		return new Controls(node);
	}

	if (!Hls.isSupported()) {
		throw new Error('HLS Will not work in this browser', {
			cause: new Error(
				'This browser does not support MSE: https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API',
			),
		});
	}

	const instance = new Hls({
		...defaultConfig,
		...hlsConfigOverride,
	});

	instance.loadSource(url);
	instance.attachMedia(node);

	instance.on(Hls.Events.LEVEL_LOADED, (event, data) => {
		console.log('Level: ', data.level);
	});

	return new Controls(node, instance);
}
