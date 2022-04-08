import * as mediasoup from 'mediasoup-client';
import {EventEmitter} from 'events';

export class RTCManager extends EventEmitter {
	private readonly device: mediasoup.Device;
	private recvTransport: mediasoup.types.Transport | null;

	constructor() {
		super();
		this.device = new mediasoup.Device();
		this.recvTransport = null;
	}

	async createRecvTransport(data: mediasoup.types.TransportOptions) {
		this.recvTransport = this.device.createRecvTransport(data);

		this.recvTransport.on('connect', (opts, callback: () => void) => {
			callback();
		});

		this.recvTransport.on('connectionstatechange', async state => {
			switch (state) {
				// We will throw events for each state change
				case 'connecting':
					this.emit('ConnectionUpdate', {status: 'connecting'});
					break;
				case 'connected':
					this.emit('ConnectionUpdate', {status: 'connected'});
					break;
				case 'failed':
				case 'closed':
				case 'disconnected':
					this.emit('ConnectionUpdate', {status: 'disconnected'});
					this.destroy();
					break;
			}
		});
	}

	async destroy() {
		if (this.recvTransport) {
			this.recvTransport.close();
		}

		this.recvTransport = null;
	}
}
