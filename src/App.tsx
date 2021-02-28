import React, { useState } from 'react';
import { useLifecycles } from 'react-use';
import './App.css';
import DebugInput from './DebugInput';
import Game from './game/Game';
import { HookInputs, UnhookInputs } from './game/InputContext';

const Header = () => (
	<div>
		<h4>Program RPG</h4>
		<p>
			A little playground of an idea.
			Spells and weapons are backed by scripts.
			You can modify these scripts at the cost of MP per compute.
		</p>
		<p>
			See <a href="https://threejs.org/docs/index.html#api/en/math/Vector3">three.js / Vector3</a> for docs on spell's position/velocity types.
		</p>
	</div>
);


function App() {
	const [showDebug, setShowDebug] = useState(false);
	useLifecycles(HookInputs, UnhookInputs);
	return (
		<div className="flex-column padded fill">
			<Header />
			<div>
				<button onClick={() => setShowDebug(!showDebug)}>Toggle Input Debug</button>
			</div>
			{showDebug && (<DebugInput />)}
			<Game />
		</div>
	);
}

export default App;
