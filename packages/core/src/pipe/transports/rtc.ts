import {Transport} from './types';

export const rtcTransport: Transport = {
	mount(node) {
		return {
			async play() {
				await node.play();
			},

			async pause() {
				node.pause();
			},
			async destroy() {
				await this.pause();
				node.remove();
			},
		};
	},
};
