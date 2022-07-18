import {UnavailableError} from '../types';
import {createLeapEvent} from './create';

export const PIPE_ROOM_UNAVAILABLE = createLeapEvent({
	requireId: false,

	async handle(
		client,
		_,
		data: UnavailableError & {
			attempted_join_token: string;
		},
	) {
		client.getRoomStateMap().set(data.attempted_join_token, {
			subscription: 'unavailable',
			error: data,
		});
	},
});
