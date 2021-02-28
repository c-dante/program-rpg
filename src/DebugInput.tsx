import { useRaf } from 'react-use';
import { globalInputs } from './game/InputContext';

const DebugInput = () => {
	useRaf(1e11); // 1e12 fails on mine

	return (
		<div>
			<h3>Debug Inputs</h3>

			<h4>Pointers</h4>
			<table>
				<thead>
					<tr>
						<td>ID</td>
						<td>Down</td>
						<td>x</td>
						<td>y</td>
						<td>At</td>
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
							<td>{gamepad.axes.join(', ')}</td>
							<td>{gamepad.buttons.map((btn, idx) => (
								<div key={idx}>
									{btn.pressed} - {btn.touched} - {btn.value}
								</div>
							))}</td>
							<td>{gamepad.connected}</td>
							<td>{gamepad.mapping}</td>
							<td>{gamepad.timestamp}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h4>Keyboard</h4>
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
}

export default DebugInput;
