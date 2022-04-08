import {HopStream, NodeConfig} from './stream';

/**
 * Join a client into a room and start streaming to
 * @param token The join token provided by Hop's API
 * @returns Created DOM nodes and the stream instance
 */
export function mount(token: string): {nodes: NodeConfig; stream: HopStream};
/**
 * Join a client into a room and start streaming to
 * @param token The join token provided by Hop's API
 * @param nodes The HTML nodes to attach the stream to
 * @returns The stream instance
 */
export function mount(token: string, nodes: NodeConfig): HopStream;
export function mount(token: string, nodes?: NodeConfig) {
	const mergedNodes = nodes ?? {
		stream: document.createElement('video'),
		capture: document.createElement('div'),
	};

	const stream = new HopStream(token, nodes ?? mergedNodes);

	if (nodes) {
		return stream;
	}

	return {
		nodes: mergedNodes,
		stream,
	};
}

export type MountFunction = typeof mount;
