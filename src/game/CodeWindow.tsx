import React, { createRef, RefObject, useState } from 'react';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import CodeMirror from 'codemirror';

import { Controls } from './config';

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

const CodeWindow = ({ keys = {} }) => {
	const [code, setCode] = useState('');

	return (
	<div className="flex-column flex-expand no-scroll">
		<h4>Spells</h4>
		<button onClick={() => setCode('!!!!!')}>asd</button>
		<SpellEditor source={code} />
		<div className="scroll">
			<table>
				<colgroup>
					<col width="50%" />
					<col width="25%" />
					<col width="25%" />
				</colgroup>
				<tbody>
					{Object.keys(Controls).map((key) => (
						<tr key={key}>
							<td>{key}</td>
							<td>{Controls[key]}</td>
							<td>{keys[Controls[key]] ? 'down' : 'up'}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	</div>
	);
};

export default CodeWindow;
