import {SetStateAction} from 'react';

/**
 * Resolves a SetStateAction into a value
 *
 * @param oldState The old state
 * @param newState The new state or action
 * @returns Resolved new state
 */
export function resolveSetStateAction<T>(
	oldState: T,
	newState: SetStateAction<T>,
): T {
	if (newState instanceof Function) {
		return newState(oldState);
	}

	return newState;
}
