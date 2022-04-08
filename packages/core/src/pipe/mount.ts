import {HopStream, NodeConfig} from './managers/stream';

/**
 * Join a client into a room and start streaming to
 * @param token The join token provided by Hop's API
 * @returns Created DOM nodes and the stream instance
 */
export async function mount(
	token: string,
): Promise<{nodes: NodeConfig; stream: HopStream}>;
/**
 * Join a client into a room and start streaming to
 * @param token The join token provided by Hop's API
 * @param nodes The HTML nodes to attach the stream to
 * @returns The stream instance
 */
export async function mount(
	token: string,
	nodes: NodeConfig,
): Promise<HopStream>;
export async function mount(token: string, nodes?: NodeConfig) {
	const mergedNodes = nodes ?? {
		stream: document.createElement('video'),
		capture: document.createElement('div'),
	};

	const stream = await HopStream.from(token, nodes ?? mergedNodes);

	if (nodes) {
		return stream;
	}

	return {
		nodes: mergedNodes,
		stream,
	};
}
