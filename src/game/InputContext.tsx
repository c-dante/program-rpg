import fp from 'lodash/fp';
import { useRef } from 'react';
import { useLifecycles, useRafLoop } from 'react-use';

export type Key = { at: number, code: string, down: boolean };
export type Pointer = { at: number, id: number, down: boolean, x: number, y: number };

export type Inputs = {
	keys: Record<string, Key>,
	pointers: Record<number, Pointer>,
	gamepads: Gamepad[],
};

export const globalInputs: Inputs = {
	keys: {},
	pointers: {},
	gamepads: [],
};

export const getGamepadId = ({ id, index }: Gamepad): string => `${index}|${id}`;

export const HookInputs = () => {
	const unregister = useRef(fp.noop);

	useLifecycles(() => {
		console.log('Register input listeners', unregister);
		// Window events in the mount/unmount sections for live reload and whatnot
		const _onKeyUp = (evt: KeyboardEvent) => {
			globalInputs.keys[evt.code] = { code: evt.code, down: true, at: evt.timeStamp };
		};
		const _onKeyDown = (evt: KeyboardEvent) => {
			globalInputs.keys[evt.code] = { code: evt.code, down: false, at: evt.timeStamp };
		};
		const _onPointerDown = (evt: PointerEvent) => {
			globalInputs.pointers[evt.pointerId] = { id: evt.pointerId, down: true, x: evt.pageX, y: evt.pageY, at: evt.timeStamp };
		};
		const _onPointerUp = (evt: PointerEvent) => {
			globalInputs.pointers[evt.pointerId] = { id: evt.pointerId, down: false, x: evt.pageX, y: evt.pageY, at: evt.timeStamp };
		};
		const _onPointerMove = (evt: PointerEvent) => {
			if (!globalInputs.pointers[evt.pointerId]) {
				globalInputs.pointers[evt.pointerId] = { id: evt.pointerId, down: false, x: evt.pageX, y: evt.pageY, at: evt.timeStamp };
			}
			globalInputs.pointers[evt.pointerId].x = evt.pageX;
			globalInputs.pointers[evt.pointerId].y = evt.pageY;
			globalInputs.pointers[evt.pointerId].at = evt.timeStamp;
		};
		// Chrome only snapshots and only emits these events -- using the getGamepads() globally for now
		// const _onGamepadConnect = (evt: Event) => {
		// 	const { gamepad } = (evt as GamepadEvent);
		// 	globalInputs.gamepads[getGamepadId(gamepad)] = gamepad;
		// 	console.log(gamepad);
		// }
		// const _onGamepadDisconnect = (evt: Event) => {
		// 	const { gamepad } = (evt as GamepadEvent);
		// 	// delete globalInputs.gamepads[getGamepadId(gamepad)];
		// }

		window.addEventListener('keyup', _onKeyUp);
		window.addEventListener('keydown', _onKeyDown);
		window.addEventListener('pointerdown', _onPointerDown);
		window.addEventListener('pointerup', _onPointerUp);
		window.addEventListener('pointermove', _onPointerMove);
		// window.addEventListener('gamepadconnected', _onGamepadConnect);
		// window.addEventListener('gamepaddisconnected', _onGamepadDisconnect);
		unregister.current = () => {
			console.log('Unregister input listeners');
			window.removeEventListener('keyup', _onKeyUp);
			window.removeEventListener('keydown', _onKeyDown);
			window.removeEventListener('pointerdown', _onPointerDown);
			window.removeEventListener('pointerup', _onPointerUp);
			window.removeEventListener('pointermove', _onPointerMove);
			// window.removeEventListener('gamepadconnected', _onGamepadConnect);
			// window.removeEventListener('gamepaddisconnected', _onGamepadDisconnect);
		};
		// setInputState({
		// 	hello: 'world',
		// });
	}, () => unregister?.current());

	// Chrome only snapshots and only emits these events -- using the getGamepads() globally for now
	useRafLoop(() => {
		globalInputs.gamepads = [...navigator.getGamepads()].filter(fp.identity) as Gamepad[];
	});

	return null;
};
