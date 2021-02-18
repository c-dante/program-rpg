import React, { createRef, RefObject, useState } from 'react';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import CodeMirror from 'codemirror';

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

const CodeWindow = () => {
	const [code, setCode] = useState('');

	return (
	<div className="flex-column flex-expand">
		<h4>Spells</h4>
		<button onClick={() => setCode('!!!!!')}>asd</button>
		<SpellEditor source={code} />
	</div>
	);
};

export default CodeWindow;
