import * as mediasoup from 'mediasoup-client';
import {Emitter} from '../../util/emitter';

export type RTCManagerEvents = {
	CONNECTION_UPDATE: {
		status: 'connecting' | 'connected' | 'disconnected';
	};
};

export class RTCManager extends Emitter<RTCManagerEvents> {
	private static readonly iceServers = [
		{urls: 'stun:stun.l.google.com:19302'},
		{urls: 'stun:stun1.l.google.com:19302'},
	];

	private readonly device: mediasoup.Device;
	private readonly producers: mediasoup.types.Producer[];
	private readonly consumers: mediasoup.types.Consumer[];
	private recvTransport: mediasoup.types.Transport | null;

	constructor() {
		super();
		this.device = new mediasoup.Device();
		this.producers = [];
		this.consumers = [];
		this.recvTransport = null;

		void this.initWebRtc();
	}

	async initWebRtc() {
		//
	}

	async createRecvTransport(data: mediasoup.types.TransportOptions) {
		this.recvTransport = this.device.createRecvTransport(data);

		this.recvTransport.on('connect', (opts, callback: () => void) => {
			callback();
		});

		this.recvTransport.on('connectionstatechange', async state => {
			switch (state) {
				// We will throw events for each state change
				case 'connecting': {
					this.emit('CONNECTION_UPDATE', {status: 'connecting'});
					break;
				}

				case 'connected': {
					this.emit('CONNECTION_UPDATE', {status: 'connected'});
					break;
				}

				case 'failed':
				case 'closed':
				case 'disconnected': {
					this.emit('CONNECTION_UPDATE', {status: 'disconnected'});
					await this.destroy();
					break;
				}

				default: {
					break;
				}
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
