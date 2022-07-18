import {LeapEdgeAuthenticationParameters} from '@onehop/leap-edge-js';
import {Client} from './leap/client';

export function init(leapConnectionParams: LeapEdgeAuthenticationParameters) {
	return Client.getInstance(leapConnectionParams);
}
