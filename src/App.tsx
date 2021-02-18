import React from 'react';
import './App.css';
import Game from './game/Game';

const Header = () => (
	<div>
		<h4>Program RPG</h4>
		<p>
			A little playground of an idea.
			Spells and weapons are backed by scripts.
			You can modify these scripts at the cost of MP per compute.
		</p>
	</div>
);

function App() {
	return (
		<div className="root">
			<Header />
			<Game />
		</div>
	);
}

export default App;
