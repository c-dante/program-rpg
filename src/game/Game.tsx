import React, { createRef } from 'react';
import type { RefObject } from 'react';
import {
	Mesh, ShaderMaterial, PlaneGeometry,
	Scene, PerspectiveCamera, WebGLRenderer,
	Vector3,
} from 'three';
import fp from 'lodash/fp';

import { Colors, Controls, PLANE_Z, SCALE, Tag } from './config';
import { makeContext, TimeStep } from './actor';
import { ContextApi, makeBox, withContext } from './api';
import CodeWindow from './CodeWindow';

import vertShader from './shaders/test-vert';
import fragShader from './shaders/test-frag';

const makeGround = (api: ContextApi) => {
	const { scene } = api.ctx;
	const mesh = new Mesh(
		new PlaneGeometry(10000, 10000),
		new ShaderMaterial({
			uniforms: {},
			vertexShader: vertShader,
			fragmentShader: fragShader,
		}),
	);
	mesh.position.z = -2;
	mesh.name = 'ground';
	scene.add(mesh);
};

const makeOther = (api: ContextApi) => {
	api.makeEntity({
		x: -1,
		y: -1,
		mesh: makeBox(Colors.Red),
		tags: new Set([Tag.Other]),
		name: 'some-enemy',
		tick(ctx, _, { mesh }) {
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;

			// Walk toward cube
			const speed = 0.01 * SCALE;
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

const spell = () => {
	const cooldown = 120;
	let last = 0;
	return (api: ContextApi, { time }: TimeStep) => {
		if (api.ctx.bb.player && api.ctx.bb.input.mouse.down && time - last >= cooldown) {
			last = time;
			api.makeEntity({
				x: api.ctx.bb.player.mesh.position.x,
				y: api.ctx.bb.player.mesh.position.y,
				// ---- @todo: phys
				state: {
					velocity: new Vector3(1, 1, 0)
						.normalize()
						.multiplyScalar(0.01 * SCALE),
					life: 1000,
				},
				// ----
				mesh: makeBox(Colors.Red),
				tags: new Set([Tag.Other]),
				name: 'some-enemy',
				tick(_, { delta }, actor) {
					const { mesh, state } = actor;
					if (state.life <= 1) {
						api.remove(actor)
						return;
					}

					// Phys baby
					state.life--;
					mesh.position.add(state.velocity.multiplyScalar(delta));
				}
			});
		}
	};
};

const otherSpawner = () => {
	let lastSpawn = Date.now();
	return (api: ContextApi) => {
		const keys = api.ctx.bb.input.keys;
		if (keys[Controls.Spawn] && Date.now() - lastSpawn >= 1000) {
			lastSpawn = Date.now();
			makeOther(api);
		}
	}
}

const cameraControls = () => (api: ContextApi, { delta }: TimeStep) => {
	const keys = api.ctx.bb.input.keys;

	// Move around
	const v = new Vector3();
	if (keys[Controls.CameraUp]) {
		v.y += 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraDown]) {
		v.y -= 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraLeft]) {
		v.x -= 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraRight]) {
		v.x += 0.1 * SCALE * delta;
	}
	api.ctx.camera.position.add(
		v.normalize().multiplyScalar(keys[Controls.CameraBoost] ? 5 : 0.5)
	);
}

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
			const keys = ctx.bb.input.keys;
			const v = new Vector3();
			if (keys[Controls.Up]) {
				v.y += 0.1 * SCALE * delta;
			}
			if (keys[Controls.Down]) {
				v.y -= 0.1 * SCALE * delta;
			}
			if (keys[Controls.Left]) {
				v.x -= 0.1 * SCALE * delta;
			}
			if (keys[Controls.Right]) {
				v.x += 0.1 * SCALE * delta;
			}
			mesh.position.add(v.normalize().multiplyScalar(0.05));
		}
	});

	// Toss another in tere
	makeOther(api);

	// Blackboard for logic comms
	api.ctx.bb.player = cube;

	// Background
	makeGround(api);

	return api;
}

export interface Props {}

export interface State {
	api: ContextApi;
	paused: boolean;
}

class Game extends React.Component<Props, State> {
	containerRef: RefObject<HTMLDivElement>;
	api: ContextApi;
	tickables: ((api: ContextApi, step: TimeStep) => void)[] = [];

	_time: number = 0;
	_frameId: number = 0;
	_unregister: () => void = fp.noop;

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
		ctx.bb.input.keys = fp.flow(
				fp.invert,
				fp.mapValues(fp.constant(false))
			)(Controls);
		this.api = withContext(ctx);
		this.tickables.push(otherSpawner());
		this.tickables.push(cameraControls());
		this.tickables.push(spell());

		this.state = {
			api: this.api,
			paused: true,
		};
	}

	componentDidMount() {
		// Window events in the mount/unmount sections for live reload and whatnot
		const _onKeyUp = (evt: KeyboardEvent) => {
			this.api.ctx.bb.input.keys[evt.code] = false;
		}
		const _onKeyDown = (evt: KeyboardEvent) => {
			this.api.ctx.bb.input.keys[evt.code] = true;
		}
		const _onMouseDown = (evt: MouseEvent) => {
			this.api.ctx.bb.input.mouse.down = true;
		}
		const _onMouseUp = (evt: MouseEvent) => {
			this.api.ctx.bb.input.mouse.down = false;
		}
		const _onMouseMove = (evt: MouseEvent) => {
			// Relative to center of render, +y is up
			const { x, y, width, height } = this.api.ctx.renderer.domElement.getBoundingClientRect();
			this.api.ctx.bb.input.mouse.x = ((evt.clientX - width / 2) - x) / width * 2;
			this.api.ctx.bb.input.mouse.y = (-((evt.clientY - height / 2) - y)) / height * 2;
		}

		window.addEventListener('keyup', _onKeyUp);
		window.addEventListener('keydown', _onKeyDown);
		window.addEventListener('mousedown', _onMouseDown);
		window.addEventListener('mouseup', _onMouseUp);
		window.addEventListener('mousemove', _onMouseMove);
		this._unregister = () => {
			window.removeEventListener('keyup', _onKeyUp);
			window.removeEventListener('keydown', _onKeyDown);
			window.removeEventListener('mousedown', _onMouseDown);
			window.removeEventListener('mouseup', _onMouseUp);
			window.removeEventListener('mousemove', _onMouseMove);
		};

		// ---- Mount Init ----- //
		this.containerRef.current?.appendChild(this.api.ctx.renderer.domElement);
		setUpScene(this.api);
		this.play();
	}

	componentWillUnmount() {
		this.pause();
		this._unregister();
	}

	play() {
		if (this.state.paused) {
			this._frameId = window.requestAnimationFrame(() => this.tick());
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

	tick() {
		if (!this.state.paused) {
			this._frameId = window.requestAnimationFrame(() => this.tick());
			const timeStep = { time: this._frameId, delta: 1 };

			// Get objects under mouse
			this.api.raycaster.setFromCamera(
				this.api.ctx.bb.input.mouse,
				this.api.ctx.camera
			);
			this.api.ctx.targets = this.api.raycaster.intersectObjects(this.api.ctx.scene.children);

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
				{this.state.paused && (
					<h3>Paused</h3>
				)}
				<div className="fill flex-row padded">
					<div className="flex-column flex-expand">
						<div ref={this.containerRef} />
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


							<button onClick={(evt) => {
								evt.currentTarget.blur();
								if (this.state.paused) {
									this.play();
								} else {
									this.pause();
								}
							}}>{this.state.paused ? 'Resume' : 'Pause'}</button>
						</div>
					</div>
					<CodeWindow
						input={this.api.ctx.bb.input}
						targets={this.api.ctx.targets}
						/>
				</div>
			</div>
		);
	}
}

export default Game;
