import fp from 'lodash/fp';

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

// Chrome only snapshots and only emits these events -- using the getGamepads() globally for now instead of watching connect/disconnect
let _frameId = 0;
const rafLoop = () => {
	globalInputs.gamepads = [...navigator.getGamepads()].filter(fp.identity) as Gamepad[];
	_frameId = window.requestAnimationFrame(rafLoop);
};

let unhook: undefined | Function = undefined;
export const UnhookInputs = () => {
	unhook?.();
	unhook = undefined;
};
export const HookInputs = () => {
	if (unhook) {
		console.warn('Attempt to re-hook inputs blocked.');
		return;
	}

	console.log('Register input listeners');
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


	_frameId = window.requestAnimationFrame(rafLoop)
	window.addEventListener('keyup', _onKeyUp);
	window.addEventListener('keydown', _onKeyDown);
	window.addEventListener('pointerdown', _onPointerDown);
	window.addEventListener('pointerup', _onPointerUp);
	window.addEventListener('pointermove', _onPointerMove);
	unhook = () => {
		console.log('Unregister input listeners');
		window.removeEventListener('keyup', _onKeyUp);
		window.removeEventListener('keydown', _onKeyDown);
		window.removeEventListener('pointerdown', _onPointerDown);
		window.removeEventListener('pointerup', _onPointerUp);
		window.removeEventListener('pointermove', _onPointerMove);
		window.cancelAnimationFrame(_frameId);
		_frameId = -1;
	};

	return UnhookInputs;
};
