export interface NodeConfig {
	capture: HTMLDivElement;
	stream: HTMLVideoElement;
}

export class HopStream {
	private readonly token;
	private readonly nodes;

	// TODO: `async` so we can do any resolutions that need to be done here (e.g. finding a node to connect to, etc)
	public static async from(token: string, nodes: NodeConfig) {
		return new HopStream(token, nodes);
	}

	private constructor(token: string, nodes: NodeConfig) {
		this.token = token;
		this.nodes = nodes;
	}
}
