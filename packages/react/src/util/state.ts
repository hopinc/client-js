import {SetStateAction} from 'react';

export function resolveSetStateAction<T>(
	oldState: T,
	newState: SetStateAction<T>,
) {
	if (newState instanceof Function) {
		return newState(oldState);
	}

	return newState;
}
