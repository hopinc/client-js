import {API} from '@onehop/js';
import {createLeapEvent} from './create';

export interface Connection {
	edge_endpoint: string;
	type: 'webrtc' | 'llhls';
	serving_pop: string;
}

export interface Payload {
	pipe_room: API.Pipe.Room;
	connection: {llhls: Connection | null; webrtc: Connection | null};
}

export const PIPE_ROOM_AVAILABLE = createLeapEvent({
	requireId: false,

	async handle(client, _, data: Payload) {
		client.getRoomStateMap().set(data.pipe_room.id, {
			subscription: 'available',
			room: data.pipe_room,
			connection: data.connection,
		});
	},
});
