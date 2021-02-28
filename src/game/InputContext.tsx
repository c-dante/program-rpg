import fp from 'lodash/fp';

export type Key = { at: number, code: string, down: boolean };
export type Pointer = { at: number, id: number, down: boolean, x: number, y: number };

// Buffered inputs for event based stuff
export type Inputs = {
	keys: Record<string, Key>,
	pointers: Record<number, Pointer>,
	gamepads: Gamepad[],
};

const PRESS_WINDOW_MS = 175; // ms to see a "down-up" event as a button press

type GamepadId = string;

let localKeyBuffer: Key[] = [];
export const keyBuffer: Key[] = [];
const bufferKeyDown = (key: Key) => {
	// Drop keys outside of buffer window + duplicate buffered keys (we'll just re-queue)
	localKeyBuffer = localKeyBuffer.filter(x => key.code !== x.code && key.at - x.at < PRESS_WINDOW_MS);
	// Add my key
	localKeyBuffer.push(key);
};
const bufferKeyUp = ({ at, code }: Key) => {
	localKeyBuffer = localKeyBuffer.filter(x => {
		if (x.code === code && at - x.at < PRESS_WINDOW_MS) {
			keyBuffer.push(x);
		}

		return x.code !== code && at - x.at < PRESS_WINDOW_MS;
	});
};

export const globalInputs: Inputs = {
	keys: {},
	pointers: {},
	gamepads: [],
};

export const getGamepadId = ({ id, index }: Gamepad): GamepadId => `${id}|${index}`;

// Chrome only snapshots and only emits these events -- using the getGamepads() globally for now instead of watching connect/disconnect
let _frameId = 0;
const rafLoop = (time) => {
	globalInputs.gamepads = [...navigator.getGamepads()].filter(fp.identity) as Gamepad[];
	while (keyBuffer.length && time - keyBuffer[0].at > 1000) {
		keyBuffer.pop();
	}
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
		if (globalInputs.keys[evt.code]?.down !== false) {
			globalInputs.keys[evt.code] = { code: evt.code, down: false, at: evt.timeStamp };
			bufferKeyUp(globalInputs.keys[evt.code]);
		}
	};
	const _onKeyDown = (evt: KeyboardEvent) => {
		if (globalInputs.keys[evt.code]?.down !== true) {
			globalInputs.keys[evt.code] = { code: evt.code, down: true, at: evt.timeStamp };
			bufferKeyDown(globalInputs.keys[evt.code]);
		}
	};
	const _onPointerDown = (evt: PointerEvent) => {
		globalInputs.pointers[evt.pointerId] = { id: evt.pointerId, down: true, x: evt.clientX, y: evt.clientY, at: evt.timeStamp };
	};
	const _onPointerUp = (evt: PointerEvent) => {
		globalInputs.pointers[evt.pointerId] = { id: evt.pointerId, down: false, x: evt.clientX, y: evt.clientY, at: evt.timeStamp };
	};
	const _onPointerMove = (evt: PointerEvent) => {
		if (!globalInputs.pointers[evt.pointerId]) {
			globalInputs.pointers[evt.pointerId] = { id: evt.pointerId, down: false, x: evt.clientX, y: evt.clientY, at: evt.timeStamp };
		}
		globalInputs.pointers[evt.pointerId].x = evt.clientX;
		globalInputs.pointers[evt.pointerId].y = evt.clientY;
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
