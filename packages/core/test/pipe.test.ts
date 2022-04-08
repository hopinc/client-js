import assert from 'assert';
import {pipe} from '@onehop/core';

void pipe.rooms.mount('', 'rtc').then(({stream, nodes}) => {
	assert(stream, 'Stream does not exist');
	assert(nodes, 'Nodes do not exist');
});
