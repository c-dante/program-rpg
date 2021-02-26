import React, { createRef, RefObject, useCallback, useEffect, useState } from 'react';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import CodeMirror from 'codemirror';
import type { Intersection } from 'three';

import { Controls } from './config';
import { GameInput } from './actor';
import fp from 'lodash/fp';
import { compileSpell, Spell } from './magic';

export interface Props {
	source?: String;
	onChange: (source: string) => void;
	onFocus: () => void;
	onBlur: () => void;
}

export interface State {}

class SpellEditor extends React.Component<Props, State> {
	containerRef: RefObject<HTMLDivElement>;
	codeMirror: any;
	dispose: () => void = fp.noop;

	constructor(props: Props) {
		super(props);
		this.containerRef = createRef<HTMLDivElement>();
	}

	componentDidMount() {
		if (this.containerRef.current) {
			const _onChange = (cm: CodeMirror) => {
				this.props.onChange(cm.doc.getValue());
			}
			const _onFocus = () => this.props.onFocus();
			const _onBlur = () => this.props.onBlur();
			this.codeMirror = new CodeMirror(this.containerRef.current, {
				lineNumbers: true,
				matchBrackets: true,
				mode: 'text/typescript',
				value: this.props.source ?? '',
			});
			this.codeMirror.on('change', _onChange);
			this.codeMirror.on('focus', _onFocus);
			this.codeMirror.on('blur', _onBlur);
			this.dispose = fp.once(() => {
				this.codeMirror.off('change', _onChange);
				this.codeMirror.off('focus', _onFocus);
				this.codeMirror.off('blur', _onBlur);
			});
		}
	}

	componentWillUnmount() {
		this.dispose();
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
	<div className="text-small">
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
	<div className="text-small">
		Target: {target.name}
	</div>
);

export interface CodeWindowProps {
	input: GameInput;
	targets?: Intersection[];
	spell?: Spell;
	onSpellChange?: (spell: Spell) => void;
	onFocus?: () => void,
	onBlur?: () => void,
}
const CodeWindow: React.FC<CodeWindowProps> = ({
	input,
	targets = [],
	spell,
	onSpellChange = fp.noop,
	onFocus = fp.noop,
	onBlur = fp.noop,
}) => {
	const [code, setCode] = useState(spell?.source ?? '');
	const [error, setError] = useState();
	const [localSpell, setLocalSpell] = useState(spell);
	useEffect(() => {
		if (spell?.source && spell.source !== code) {
			setCode(spell.source);
			setLocalSpell(spell);
		}
	}, [code, spell, setLocalSpell]);

	const parseSpell = useCallback((incantation: string) => {
		try {
			const newSpell = compileSpell(incantation);
			setLocalSpell(newSpell);
			setError(undefined);
		} catch (error) {
			setLocalSpell(undefined);
			setError(error);
		}
	}, []);

	return (
	<div className="flex-column flex-expand no-scroll">
		<h4>Spells</h4>
		<div className="error-bar text-small flex-row flex-middle">{error && String(error)}&nbsp;</div>
		<button disabled={error} onClick={() => {
			if (localSpell) {
				onSpellChange(localSpell);
			}
		}}>Update</button>
		<SpellEditor
			source={code}
			onChange={parseSpell}
			onFocus={onFocus}
			onBlur={onBlur}
		/>
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
