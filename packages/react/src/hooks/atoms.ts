import type {util} from '@onehop/client';
import {useSyncExternalStore} from 'react';

export function useAtom<T>(atom: util.atoms.Atom<T>) {
	const get = () => atom.get();
	return useSyncExternalStore(atom.addListener, get, get);
}
