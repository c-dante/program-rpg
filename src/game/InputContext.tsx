import fp from 'lodash/fp';
import { createContext, useContext, useRef, useState } from 'react';
import { useLifecycles } from 'react-use';

export const defaultInputs = {

};
export type Inputs = typeof defaultInputs;

export const InputContext = createContext(defaultInputs);

export const ProvideInput = ({ children }) => {
	const unregister = useRef(fp.noop);
	const [inputState, setInputState] = useState(defaultInputs);
	useLifecycles(() => {
		console.log('Register input listeners', unregister);
		// Window events in the mount/unmount sections for live reload and whatnot
		const _onKeyUp = (evt: KeyboardEvent) => {
			console.log(evt);
			// this.api.ctx.bb.input.keys[evt.code] = false;
		};
		const _onKeyDown = (evt: KeyboardEvent) => {
			console.log(evt);
			// this.api.ctx.bb.input.keys[evt.code] = true;
		};
		const _onPointerDown = (evt: PointerEvent) => {
			console.log(evt);
			// this.api.ctx.bb.input.mouse.down = true;
		};
		const _onPointerUp = (evt: PointerEvent) => {
			console.log(evt);
			// this.api.ctx.bb.input.mouse.down = false;
		};
		const _onPointerMove = (evt: PointerEvent) => {
			// console.log(evt);
			// Relative to center of render, +y is up
			// const { x, y, width, height } = this.api.ctx.renderer.domElement.getBoundingClientRect();
			// this.api.ctx.bb.input.mouse.x = ((evt.clientX - width / 2) - x) / width * 2;
			// this.api.ctx.bb.input.mouse.y = (-((evt.clientY - height / 2) - y)) / height * 2;
		};
		const _onGamepadConnect = (evt: Event) => {
			console.log(evt);
		}

		window.addEventListener('keyup', _onKeyUp);
		window.addEventListener('keydown', _onKeyDown);
		window.addEventListener('pointerdown', _onPointerDown);
		window.addEventListener('pointerup', _onPointerUp);
		window.addEventListener('pointermove', _onPointerMove);
		window.addEventListener('gamepadconnected', _onGamepadConnect);
		unregister.current = () => {
			console.log('Unregister input listeners');
			window.removeEventListener('keyup', _onKeyUp);
			window.removeEventListener('keydown', _onKeyDown);
			window.removeEventListener('pointerdown', _onPointerDown);
			window.removeEventListener('pointerup', _onPointerUp);
			window.removeEventListener('pointermove', _onPointerMove);
			window.removeEventListener('gamepadconnected', _onGamepadConnect);
		};
		// setInputState({
		// 	hello: 'world',
		// });
	}, () => unregister?.current());

	return (
		<InputContext.Provider value={inputState}>
			{children}
		</InputContext.Provider>
	)
};

export const useInputContext = () => useContext(InputContext);
