import fp from 'lodash/fp';
import React from 'react';
import { Fragment } from 'react';
import { useRaf } from 'react-use';
import { XboxButtonMap, XboxButtons } from './game/inputs/xbox';
import { globalInputs, keyBuffer } from './game/inputs/globalContext';

const Axis = ({ x, y, radius, innerRadius = radius / 6 }) => (
	<svg version="1.1" width={radius * 2} height={radius * 2}>
		<circle cx={radius} cy={radius} r={radius} />
		<circle cx={radius + x*(radius - innerRadius)} cy={radius + y*(radius - innerRadius)} r={innerRadius} fill='red' />
	</svg>
);

interface GamepadButtonsProps {
	gamepad: Gamepad;
}
interface GamepadButtonsState {
	index: number;
	mapping: Record<number, XboxButtons>;
}
class GamepadButtons extends React.Component<GamepadButtonsProps, GamepadButtonsState> {
	constructor(props) {
		super(props);

		this.state = {
			index: props.gamepad.index,
			mapping: { ...XboxButtonMap },
		};
	}

	componentDidUpdate(prevProps) {
		if (prevProps.gamepad.index !== this.state.index) {
			console.warn('Oh no, swapped gamepads!');
		}
	}

	render() {
		return (
			<div>
				{this.props.gamepad.buttons.map((btn, idx) => (
					<div key={idx}>
						({idx}) {this.state.mapping[idx]} {btn.pressed} - {btn.touched} - {btn.value}
					</div>
				))}
			</div>
		);
	}
}

const DebugInput = () => {
	useRaf(1e11); // 1e12 fails on mine

	return (
		<div className="text-small">
			<h3>Debug Inputs</h3>

			<h4>Pointers</h4>
			<table>
				<thead>
					<tr>
						<td>id</td>
						<td>down</td>
						<td>x</td>
						<td>y</td>
						<td>at</td>
					</tr>
				</thead>
				<tbody>
					{Object.entries(globalInputs.pointers).map(([id,v]) => (
						<tr key={id}>
							<td>{id}</td>
							<td>{String(v.down)}</td>
							<td>{v.x}</td>
							<td>{v.y}</td>
							<td>{v.at}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h4>Gamepads</h4>
			<table>
				<thead>
					<tr>
						<td>id</td>
						<td>axes</td>
						<td>buttons</td>
						<td>connected</td>
						<td>mapping</td>
						<td>At</td>
					</tr>
				</thead>
				<tbody>
					{globalInputs.gamepads.map((gamepad) => (
						<tr key={gamepad.id}>
							<td>{gamepad.id}</td>
							<td>{fp.chunk(2, gamepad.axes).map(([x, y], index) => (
								<Axis x={x} y={y} radius={25} key={index} />
							))}</td>
							<td>
								<GamepadButtons gamepad={gamepad} />
							</td>
							<td>{String(gamepad.connected)}</td>
							<td>{gamepad.mapping}</td>
							<td>{gamepad.timestamp}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h4>Keyboard</h4>
			<div>
				Buffered Keys
				<table>
					<tbody>
					<tr>
						{keyBuffer.map((key) => (
							<Fragment key={key.at}>
								<td>{key.code}</td>
							</Fragment>
						))}
					</tr>
					<tr>
						{keyBuffer.map((key) => (
							<Fragment key={key.at}>
								<td>{key.at}</td>
							</Fragment>
						))}
					</tr>
					</tbody>
				</table>
			</div>
			<table>
				<thead>
					<tr>
						<td>Key</td>
						<td>Down</td>
						<td>At</td>
					</tr>
				</thead>
				<tbody>
					{Object.entries(globalInputs.keys).map(([k,v]) => (
						<tr key={k}>
							<td>{k}</td>
							<td>{String(v.down)}</td>
							<td>{v.at}</td>
						</tr>
					))}
				</tbody>
			</table>

		</div>
	);
};

export default DebugInput;
