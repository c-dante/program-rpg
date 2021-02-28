import { Inputs, useInputContext } from './game/InputContext';

const DebugInput: React.FC<Inputs> = () => {
	const input = useInputContext();
	console.debug('DebugInput', { input });
	return (
		<div>
			<h3>Debug Inputs</h3>
			<h4>Pointers</h4>
			<h4>Gamepads</h4>
			<h4>Keyboard</h4>
		</div>
	);
}

export default DebugInput;
