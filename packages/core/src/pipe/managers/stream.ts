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
	private readonly token;
	private readonly nodes;
	private readonly state;

	// TODO: `async` so we can do any resolutions that need to be done here (e.g. finding a node to connect to, etc)
	public static async from(
		token: string,
		nodes: NodeConfig,
		options: HopStreamOptions,
	) {
		return new HopStream(token, nodes, {
			volume: 1.0,
			muted: false,
			...options,
		});
	}

	/**
	 * Constructor for HopStream
	 * @param token The join token to connect to a room
	 * @param nodes The HTML nodes to render and capture to
	 */
	private constructor(
		token: string,
		nodes: NodeConfig,
		options: Required<HopStreamOptions>,
	) {
		this.token = token;
		this.nodes = nodes;
		this.state = {
			muted: options.muted,
		};
	}
}
