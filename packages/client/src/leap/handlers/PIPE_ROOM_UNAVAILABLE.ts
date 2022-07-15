import {id} from '@onehop/js';
import {LeapChannelSubscriptionError} from '../types';
import {createLeapEvent} from './create';

export const PIPE_ROOM_UNAVAILABLE = createLeapEvent({
	async handle(
		client,
		room,
		data: {graceful: boolean; error_code?: LeapChannelSubscriptionError},
	) {
		client.getRoomStateMap().set(id(room, 'room'), {
			subscription: 'unavailable',
		});
	},
});
