export interface NodeConfig {
	capture: HTMLDivElement;
	stream: HTMLVideoElement;
}

export interface HopStreamState {
	volume: number;
	muted: boolean;
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
		state?: Partial<Pick<HopStreamState, 'volume' | 'muted'>>,
	) {
		return new HopStream(token, nodes, {
			volume: 1.0,
			muted: false,
			...state,
		});
	}

	/**
	 * Constructor for HopStream
	 * @param token The join token to connect to a room
	 * @param nodes The HTML nodes to render and capture to
	 */
	private constructor(token: string, nodes: NodeConfig, state: HopStreamState) {
		this.token = token;
		this.nodes = nodes;
		this.state = state;
	}
}
