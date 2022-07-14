import {leap} from '@onehop/client';
import {createContext, useContext} from 'react';

const leapContext = createContext(new leap.Client());

export function useLeap(): leap.Client {
	return useContext(leapContext);
}
