import React from 'react';
import './App.css';
import DebugInput from './DebugInput';
import Game from './game/Game';
import { HookInputs } from './game/InputContext';

const Header = () => (
	<div>
		<h4>Program RPG</h4>
		<p>
			A little playground of an idea.
			Spells and weapons are backed by scripts.
			You can modify these scripts at the cost of MP per compute.

			See <a href="https://threejs.org/docs/index.html#api/en/math/Vector3">three.js / Vector3</a> for docs on spell's position/velocity types.
		</p>
	</div>
);


function App() {
	return (
		<div className="flex-column padded fill">
			<Header />
			<HookInputs />
			<DebugInput />
			<Game />
		</div>
	);
}

export default App;
