import {id} from '@onehop/js';
import {UnavailableError} from '../types';
import {createLeapEvent} from './create';

export const PIPE_ROOM_UNAVAILABLE = createLeapEvent({
	async handle(client, room, data: UnavailableError) {
		client.getRoomStateMap().set(id(room, 'room'), {
			subscription: 'unavailable',
			error: data,
		});
	},
});
