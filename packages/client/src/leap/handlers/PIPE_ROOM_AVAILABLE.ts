import type {API} from '@onehop/js';
import {createLeapEvent} from './create';

export type Connection = {
	edge_endpoint: string;
};

export type Payload = {
	pipe_room: API.Pipe.Room;
	connection: {llhls?: Connection; webrtc?: Connection};
};

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
