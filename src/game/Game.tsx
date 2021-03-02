import React, { createRef } from 'react';
import type { RefObject } from 'react';
import {
	Mesh, ShaderMaterial, PlaneGeometry,
	Scene, PerspectiveCamera, WebGLRenderer,
	Vector3,
	MeshBasicMaterial,
} from 'three';
import fp from 'lodash/fp';

import { Colors, Controls, PLANE_Z, SCALE, Tag } from './config';
import { makeContext, TimeStep } from './gameContext';
import { ContextApi, makeBox, withContext } from './api';
import CodeWindow from './CodeWindow';
import * as ai from './ai';

import vertShader from './shaders/test-vert';
import { Spell, spellBook, spellCaster } from './magic';
import fragShader from './shaders/test-frag';
import { axisPastDeadzone } from './inputs/globalContext';


const makeOther = (api: ContextApi) => {
	// Make the other near the player
	const origin = (api.ctx.bb.player?.mesh?.position ?? new Vector3()).clone()
		.add(
			new Vector3().setFromSphericalCoords(Math.random() * 4 + 3, Math.random() * Math.PI * 2, Math.PI/2)
		);

	api.makeEntity({
		x: origin.x,
		y: origin.y,
		mesh: makeBox(Colors.Red),
		tags: new Set([Tag.Other]),
		name: 'some-enemy',
		tick(ctx, _, { mesh }) {
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;

			// Walk toward cube
			const speed = 0.1 * SCALE;
			if (ctx.bb.player && mesh.position.distanceTo(ctx.bb.player.mesh.position) > speed) {
				const v = ctx.bb.player.mesh.position.clone()
					.sub(mesh.position)
					.normalize()
					.multiplyScalar(speed);
					mesh.position.add(v);
			}
		}
	});
};

const otherSpawner = () => {
	let lastSpawn = Date.now();
	return (api: ContextApi) => {
		const { keys } = api.ctx.bb.input.globalInputs;
		if (keys[Controls.Spawn]?.down && Date.now() - lastSpawn >= 250) {
			lastSpawn = Date.now();
			makeOther(api);
		}
	};
};

const twinstickCamera = () => (api: ContextApi) => {
	if (api.ctx.bb.player?.mesh.position) {
		const target = api.ctx.bb.player.mesh.position.clone()
			.setZ(api.ctx.camera.position.z);
		if (api.ctx.camera.position.distanceTo(target) < 0.1) {
			api.ctx.camera.position.copy(target);
		} else {
			api.ctx.camera.position.lerp(target, 0.1);
		}
	}
};

const setUpScene = (api: ContextApi) => {
	// Player stuff
	const cube = api.makeEntity({
		x: 1,
		y: 1,
		name: 'cube',
		tick(ctx, { delta }, { mesh }) {
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;

			// Move around
			const { globalInputs } = ctx.bb.input;
			const v = new Vector3();

			// In units / millie
			const speed = 0.12 * (globalInputs.keys[Controls.Boost]?.down ? 2 : 1);
			if (globalInputs.keys[Controls.Up]?.down) {
				v.y++;
			}
			if (globalInputs.keys[Controls.Down]?.down) {
				v.y--;
			}
			if (globalInputs.keys[Controls.Left]?.down) {
				v.x--;
			}
			if (globalInputs.keys[Controls.Right]?.down) {
				v.x++;
			}

			// Move around _with sticks_
			if (globalInputs.gamepads?.[0]?.axes) {
				const [moveX, moveY] = globalInputs.gamepads?.[0]?.axes;
				if (axisPastDeadzone(moveX, + moveY)) {
					v.x = moveX;
					v.y = -moveY;
				}
			}
			mesh.position.add(v
				.normalize()
				.multiplyScalar(speed * SCALE * delta)
			);
		}
	});

	// Toss another in tere
	makeOther(api);

	// Blackboard for logic comms
	api.ctx.bb.player = cube;

	// Background
	const ground = new Mesh(
		new PlaneGeometry(10000, 10000),
		new ShaderMaterial({
			uniforms: {},
			vertexShader: vertShader,
			fragmentShader: fragShader,
		}),
	);
	ground.position.z = -2;
	ground.name = 'ground';
	api.ctx.scene.add(ground);

	// Mouse targeting plane
	const targeting = new Mesh(
		new PlaneGeometry(1000000, 1000000),
		new MeshBasicMaterial({
			opacity: 0,
			transparent: true,
		}),
	);
	targeting.name = 'targeting';
	api.ctx.scene.add(targeting);

	return api;
};

export interface Props {}

export interface State {
	api: ContextApi;
	paused: boolean;

	// [SPELLS] @todo: clean up spell ideas
	spellSaved: number;
	currentSpell?: Spell;
	currentSpellTicker?: AppTick;
}

type AppTick = (api: ContextApi, step: TimeStep) => void;
class Game extends React.Component<Props, State> {
	containerRef: RefObject<HTMLDivElement>;
	api: ContextApi;
	tickables: AppTick[] = [];

	_time: number = 0;
	_frameId: number = 0;

	constructor(props) {
		super(props);

		// Init in constructor
		const width = 480;
		const height = 480;
		const ctx = makeContext({
			scene: new Scene(),
			camera: new PerspectiveCamera(35, width / height, 0.1, 1000),
			renderer: new WebGLRenderer(),
		});
		this.containerRef = createRef<HTMLDivElement>();
		ctx.renderer.setSize(width, height);
		ctx.camera.position.z = PLANE_Z;
		this.api = withContext(ctx);
		this.tickables.push(otherSpawner());
		this.tickables.push(ai.spawner());
		this.tickables.push(twinstickCamera());

		this.state = {
			api: this.api,
			paused: true,

			spellSaved: 0,
			currentSpell: undefined,
			currentSpellTicker: undefined,
		};
	}

	componentDidMount() {
		// ---- Mount Init ----- //
		this.containerRef.current?.appendChild(this.api.ctx.renderer.domElement);
		setUpScene(this.api);
		this.setSpell(fp.sample(spellBook) ?? spellBook[0]);
		this.play();
	}

	componentWillUnmount() {
		this.pause();
	}

	play() {
		if (this.state.paused) {
			this._time = performance.now();
			this._frameId = window.requestAnimationFrame((t) => this.tick(t));
			this.setState({ paused: false });
		}
	}

	pause() {
		if (!this.state.paused) {
			window.cancelAnimationFrame(this._frameId);
			this._frameId = -1;
			this.setState({ paused: true });
		}
	}

	tick(atTime: number) {
		if (!this.state.paused) {
			this._frameId = window.requestAnimationFrame((t) => this.tick(t));
			const timeStep: TimeStep = {
				time: atTime,
				delta: atTime - this._time,
			};
			this._time = atTime;

			// Transform mouse into game space
			if (this.api.ctx.bb.input.globalInputs.pointers[1]) {
				const { x, y, width, height } = this.api.ctx.renderer.domElement.getBoundingClientRect();
				const { x: clientX, y: clientY } = this.api.ctx.bb.input.globalInputs.pointers[1];
				this.api.ctx.bb.input.mouse.x = ((clientX - width / 2) - x) / width * 2;
				this.api.ctx.bb.input.mouse.y = - ((clientY - height / 2) - y) / height * 2;
			}

			// Get objects under mouse
			this.api.raycaster.setFromCamera(
				this.api.ctx.bb.input.mouse,
				this.api.ctx.camera
			);
			this.api.ctx.targets = this.api.raycaster.intersectObjects(this.api.ctx.scene.children);
			this.api.ctx.targeting = this.api.ctx.targets.find(x => x.object.name === 'targeting');

			// Tick the world
			this.tickables.forEach(tick => tick(this.api, timeStep));
			this.api.ctx.actors.forEach(actor => actor.tick(this.api.ctx, timeStep, actor));
			this.api.ctx.renderer.render(this.api.ctx.scene, this.api.ctx.camera);

			// Render react
			this.setState({ api: this.api });
		}
	}

	render() {
		return (
			<div className="flex-expand">
				<div className="fill flex-row padded">
					<div className="flex-column flex-expand">
						<div ref={this.containerRef}>
							{this.state.paused && (
								<div className="fill pause-overlay">
									<h3>Paused</h3>
								</div>
							)}

							<div className="fill spell-saved-overlay" style={{
								opacity: Boolean(this.state.spellSaved) ? 1 : 0,
							}}>
								<h3>Spell Saved</h3>
							</div>
						</div>
						<div className="flex-row">
							<button disabled={!this.api.ctx.bb.player} onClick={(evt) => {
								evt.currentTarget.blur();
								if (this.api.ctx.bb.player) {
									this.api.ctx.camera.position.setX(
										this.api.ctx.bb.player.mesh.position.x
									);
									this.api.ctx.camera.position.setY(
										this.api.ctx.bb.player.mesh.position.y
									);
								}
							}}>Center Player</button>

							<button onClick={(evt) => {
								evt.currentTarget.blur();
								this.api.removeByTags([Tag.Other]);
							}}>Clear Other</button>

							<button
								className={this.state.paused ? 'pause-btn--paused' : 'pause-btn--playing'}
								onClick={(evt) => {
								evt.currentTarget.blur();
								if (this.state.paused) {
									this.play();
								} else {
									this.pause();
								}
							}}>{this.state.paused ? 'Resume' : 'Pause'}</button>

							<button onClick={() => this.setSpell(fp.sample(spellBook) ?? spellBook[0])}>Random Spell</button>
							<select value={-1} onChange={evt => {
								evt.currentTarget.blur();
								const spell = spellBook[evt.target.value];
								if (spell) {
									this.setSpell(spell);
								}
							}}>
								<option value={-1}>Spellbook</option>
								{spellBook.map((_, i) => (
									<option value={i} key={i}>Spell {i}</option>
								))}
							</select>
						</div>
					</div>
					<CodeWindow
						input={this.api.ctx.bb.input}
						targets={this.api.ctx.targets}
						spell={this.state.currentSpell}
						onFocus={() => {
							if (!this.state.paused) {
								this.pause();
							}
						}}
						onSpellChange={(spell: Spell) => {
							this.setSpell(spell);
						}}
						/>
				</div>
			</div>
		);
	}


	// -------------
	// Pull out logic / hacks I guess
	// -------------
	setSpell(spell: Spell) {
		// [SPELLS] @todo: clean up spell ideas
		if (this.state.currentSpellTicker) {
			this.tickables = this.tickables.filter(x => x !== this.state.currentSpellTicker);
		}

		const currentSpellTicker = spellCaster(spell);
		this.tickables.push(currentSpellTicker);

		if (this.state.spellSaved) {
			clearTimeout(this.state.spellSaved);
		}
		const saveTimeout = +setTimeout(() => {
			this.setState({
				spellSaved: 0,
			});
		}, 2000);

		this.setState({
			spellSaved: saveTimeout,
			currentSpell: spell,
			currentSpellTicker,
		});

	}
}

export default Game;
