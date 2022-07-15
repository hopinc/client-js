import {leap} from '@onehop/client';
import {LeapEdgeAuthenticationParameters} from '@onehop/leap-edge-js';
import {createContext, useContext} from 'react';

const leapContext = createContext(new leap.Client());

export function useLeap(): leap.Client {
	return useContext(leapContext);
}

export function useConnect() {
	const leap = useLeap();

	return (auth: LeapEdgeAuthenticationParameters) => {
		leap.connect(auth);
	};
}
