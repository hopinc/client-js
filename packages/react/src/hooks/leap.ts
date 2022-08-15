import {hop, leap} from '@onehop/client';
import {LeapEdgeAuthenticationParameters} from '@onehop/leap-edge-js';
import {createContext, useContext, useEffect} from 'react';
import {useAtom} from './atoms';

const leapContext = createContext(leap.instance);

export function useLeap(): leap.Client {
	return useContext(leapContext);
}

export function useConnect() {
	const leap = useLeap();

	return (auth: LeapEdgeAuthenticationParameters) => {
		leap.connect(auth);
	};
}

export function useConnectionState() {
	const client = useLeap();

	return useAtom(client.getConnectionState(true));
}

/**
 * Initialises Hop's client. This hook should only be rendered
 * at the top level of your app (e.g. so the component only mounts once).
 *
 * Extremely useful for things like Server Side Rendering, as it won't allow
 * hop to connect to leap until we're in the browser.
 *
 * If you want to initialise yourself feel free to copy the hook
 * into your own code. Or, if you're completely client side rendered
 * and don't have a React server rendering step, then you can call
 * hop.init outside of React lifecycle and all @onehop/react hooks will
 * still work exactly as expected.
 *
 * @param params Authentication parameters for leap
 */
export function useInit(params?: LeapEdgeAuthenticationParameters) {
	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		if (!params) {
			throw new Error(
				'Leap authentication params are required when using useInit in the browser',
			);
		}

		hop.init(params);
	}, []);
}
