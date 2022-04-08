import {transports} from '../transports';
import {TransportType} from '../transports/types';

export interface NodeConfig {
	capture: HTMLDivElement;
	stream: HTMLVideoElement;
}

export interface HopStreamState {
	volume: number;
	muted: boolean;
}

export interface HopStreamOptions
	extends Partial<Pick<HopStreamState, 'volume' | 'muted'>> {
	transport: TransportType;
}

/**
 * HopStream manages an instance of a stream to an HTMLVideoElement.
 */
export class HopStream {
	public static async from(
		token: string,
		nodes: NodeConfig,
		options: HopStreamOptions,
	) {
		// TODO: Resolve our track to stream from
		const track = new MediaStreamTrack();

		return new HopStream(token, track, nodes, {
			volume: 1.0,
			muted: false,
			...options,
		});
	}

	private readonly token;
	private readonly nodes;
	private readonly state;
	private readonly transport;

	/**
	 * Constructor for HopStream
	 * @param token The join token to connect to a room
	 * @param nodes The HTML nodes to render and capture to
	 */
	private constructor(
		token: string,
		track: MediaStreamTrack,
		nodes: NodeConfig,
		options: Required<HopStreamOptions>,
	) {
		const stream = new MediaStream();
		nodes.stream.srcObject = stream;

		stream.addTrack(track);

		this.token = token;
		this.nodes = nodes;
		this.transport = transports[options.transport].mount(nodes.stream);
		this.state = {
			muted: options.muted,
		};
	}

	async play() {
		await this.transport.play();
	}

	async pause() {
		await this.transport.pause();
	}
}
