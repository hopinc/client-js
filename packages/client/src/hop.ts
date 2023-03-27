import type {LeapEdgeAuthenticationParameters} from '@onehop/leap-edge-js';
import type {ClientInitOptions} from './leap';
import {instance} from './leap/client';

export function init(
	leapConnectionParams: LeapEdgeAuthenticationParameters,
	options?: ClientInitOptions,
) {
	instance.connect(
		leapConnectionParams,
		options?.leapSocketUrl
			? {socketUrl: options.leapSocketUrl, debug: false}
			: undefined,
	);

	return instance;
}
