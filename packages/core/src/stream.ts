export interface NodeConfig {
	capture: HTMLDivElement;
	stream: HTMLVideoElement;
}

export class HopStream {
	private readonly token;
	private readonly nodes;

	constructor(token: string, nodes: NodeConfig) {
		this.token = token;
		this.nodes = nodes;
	}
}
