import * as mediasoup from 'mediasoup-client';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class,@typescript-eslint/naming-convention
export class RTCManager {
	private device: mediasoup.Device;
	private recvTransport: mediasoup.types.Transport | null;

	constructor() {
		this.device = new mediasoup.Device();
		this.recvTransport = null;
	}

	async createRecvTransport(data: mediasoup.types.TransportOptions) {
		this.recvTransport = this.device.createRecvTransport(data);

		this.recvTransport.on('connect', ({dtlsParameters}, callback, _err) => {
			callback();
		});
	}

	async destroy() {
		if (this.recvTransport) this.recvTransport.close();
		this.recvTransport = null;
	}
}
