import {API} from '@onehop/js';
import {createLeapEvent} from './create';

export interface Connection {
	edge_endpoint: string;
}

export interface Payload {
	pipe_room: API.Pipe.Room;
	connection: {llhls?: Connection; webrtc?: Connection};
}

export const PIPE_ROOM_AVAILABLE = createLeapEvent({
	requireId: false,

	async handle(client, _, data: Payload) {
		client.getRoomStateMap().set(data.pipe_room.join_token, {
			subscription: 'available',
			room: data.pipe_room,
			connection: data.connection,
		});
	},
});
