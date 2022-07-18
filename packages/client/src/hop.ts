import {LeapEdgeAuthenticationParameters} from '@onehop/leap-edge-js';
import {instance} from './leap/client';

export function init(leapConnectionParams: LeapEdgeAuthenticationParameters) {
	instance.connect(leapConnectionParams);
	return instance;
}
