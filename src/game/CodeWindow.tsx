import React, { createRef, RefObject, useState } from 'react';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import CodeMirror from 'codemirror';
import type { Intersection, Object3D } from 'three';

import { Controls } from './config';
import { GameInput } from './actor';

export interface Props {
	source?: String;
}

export interface State {}

class SpellEditor extends React.Component<Props, State> {
	containerRef: RefObject<HTMLDivElement>;
	codeMirror: any;

	constructor(props: Props) {
		super(props);
		this.containerRef = createRef<HTMLDivElement>();
	}

	componentDidMount() {
		if (this.containerRef.current) {
			this.codeMirror = new CodeMirror(this.containerRef.current, {
				lineNumbers: true,
				matchBrackets: true,
				mode: 'text/typescript',
				value: this.props.source ?? '',
			});
		}
	}

	componentDidUpdate(prevProps: Props) {
		if (this.props.source !== prevProps.source) {
			this.codeMirror.setValue(this.props.source);
		}
	}

	render() {
		return (
			<div ref={this.containerRef} />
		);
	}
}

const DebugInputTable = ({ input }) => (
	<div className="debug-input-table">
		<table>
			<colgroup>
				<col width="40%" />
				<col width="30%" />
				<col width="35%" />
			</colgroup>
			<tbody>
				<tr>
					<td>Mouse</td>
					<td colSpan={2}>{input.mouse.down ? 'down' : 'up'}</td>
				</tr>
				<tr>
					<td></td>
					<td>{input.mouse.x.toPrecision(4)}</td>
					<td>{input.mouse.y.toPrecision(4)}</td>
				</tr>
				{Object.keys(Controls).map((key) => (
					<tr key={key}>
						<td>{key}</td>
						<td>{Controls[key]}</td>
						<td>{input.keys[Controls[key]] ? 'down' : 'up'}</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

const DebugTarget = ({ target }) => (
	<div className="debug-target">
		Target: {target.name}
	</div>
);

export interface CodeWindowProps {
	input: GameInput;
	targets?: Intersection[];
}
const CodeWindow: React.FC<CodeWindowProps> = ({ input, targets = [] }) => {
	const [code, setCode] = useState('');

	return (
	<div className="flex-column flex-expand no-scroll">
		<h4>Spells</h4>
		<button onClick={() => setCode('!!!!!')}>asd</button>
		<SpellEditor source={code} />
		<div className="flex-row flex-expand no-scroll">
			<div className="flex-expand scroll">
				{input ? <DebugInputTable input={input} /> : null}
			</div>
			<div className="flex-expand">
				{targets.length <= 0 && 'Nothing under mouse'}
				{targets.map((target, idx) => (
					<DebugTarget target={target.object} key={idx} />
				))}
			</div>
		</div>
	</div>
	);
};

export default CodeWindow;
