import type {util} from '@onehop/client';
import {useEffect, useState} from 'react';

export function useAtom<T>(atom: util.atoms.Atom<T>) {
	const [value, setValue] = useState({atom});

	useEffect(() => {
		const listening = atom.addListener(() => {
			setValue({atom});
		});

		return () => {
			listening.remove();
		};
	}, [atom]);

	return value.atom.get();
}
