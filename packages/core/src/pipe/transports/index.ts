import {hlsTransport} from './hls';
import {rtcTransport} from './rtc';
import {Transport, TransportType} from './types';

export const transports: Record<TransportType, Transport> = {
	rtc: rtcTransport,
	hls: hlsTransport,
};
