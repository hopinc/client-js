import {hop, pipe} from '@onehop/client';

declare const node: HTMLVideoElement;

const client = hop.init({
	projectId: 'project_xxx',
});

const joinToken = 'join_token_xxx';

client.subscribeToPipeRoom(joinToken);

client.getRoomStateMap().addListener(map => {
	const room = map.get(joinToken);

	if (
		!room ||
		room.subscription !== 'available' ||
		!room.connection.llhls?.edge_endpoint
	) {
		console.log('Not ready:', {room});
		return;
	}

	pipe.mount(node, room.connection.llhls.edge_endpoint);
});
