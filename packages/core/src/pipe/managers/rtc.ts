import * as mediasoup from 'mediasoup-client';

export class RTCManager {
	private readonly device: mediasoup.Device;
	private recvTransport: mediasoup.types.Transport | null;

	constructor() {
		this.device = new mediasoup.Device();
		this.recvTransport = null;
	}

	async createRecvTransport(data: mediasoup.types.TransportOptions) {
		this.recvTransport = this.device.createRecvTransport(data);

		this.recvTransport.on('connect', (opts, callback: () => void) => {
			callback();
		});
	}

	async destroy() {
		if (this.recvTransport) {
			this.recvTransport.close();
		}

		this.recvTransport = null;
	}
}
