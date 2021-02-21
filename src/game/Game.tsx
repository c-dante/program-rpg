import React, { createRef } from 'react';
import type { RefObject } from 'react';
import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import fp from 'lodash/fp';

import { Colors, Controls, PLANE_Z, SCALE } from './config';
import { ContextApi, Context, withContext, makeContext } from './actor';
import CodeWindow from './CodeWindow';

const makeOther = (api: ContextApi) => {
	api.makeEntity({
		x: -1,
		y: -1,
		color: Colors.Red,
		tick(ctx, self) {
			self.rotation.x += 0.01;
			self.rotation.y += 0.01;

			// Walk toward cube
			const speed = 0.01 * SCALE;
			if (self.position.distanceTo(ctx.bb.cube.mesh.position) > speed) {
				const v = ctx.bb.cube.mesh.position.clone()
					.sub(self.position)
					.normalize()
					.multiplyScalar(speed);
				self.position.add(v);
			}
		}
	});
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

const setUpScene = (api: ContextApi) => {
	const cube = api.makeEntity({
		x: 1,
		y: 1,
		tick(ctx, self) {
			self.rotation.x += 0.01;
			self.rotation.y += 0.01;

			// Move around
			const keys = ctx.bb.input.keys;
			const v = new Vector3();
			if (keys[Controls.Up]) {
				v.y += 0.1 * SCALE;
			}
			if (keys[Controls.Down]) {
				v.y -= 0.1 * SCALE;
			}
			if (keys[Controls.Left]) {
				v.x -= 0.1 * SCALE;
			}
			if (keys[Controls.Right]) {
				v.x += 0.1 * SCALE;
			}
			self.position.add(v.normalize().multiplyScalar(0.05));
		}
	});

	makeOther(api);

	// Blackboard because why not
	api.ctx.bb.cube = cube;

	return api;
}

export interface Props {}

export interface State {
	api: ContextApi;
}

class Game extends React.Component<Props, State> {
	containerRef: RefObject<HTMLDivElement>;
	api: ContextApi;
	tickables: ((api: ContextApi) => void)[] = [];

	_paused: boolean = true;
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
		ctx.bb.input = {
			keys: {},
		};
		this.api = withContext(ctx);
		this.tickables.push(otherSpawner());

		this.state = {
			api: this.api,
		};
	}

	componentDidMount() {
		// Window events in the mount/unmount sections
		const _onKeyUp = (evt) => {
			this.api.ctx.bb.input.keys[evt.code] = false;
		}
		const _onKeyDown = (evt) => {
			this.api.ctx.bb.input.keys[evt.code] = true;
		}

		window.addEventListener('keyup', _onKeyUp);
		window.addEventListener('keydown', _onKeyDown);
		this._unregister = () => {
			window.removeEventListener('keyup', _onKeyUp);
			window.removeEventListener('keydown', _onKeyDown);
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
		if (this._paused) {
			this._paused = false;
			this._frameId = window.requestAnimationFrame(() => this.tick());
		}
	}

	pause() {
		if (!this._paused) {
			window.cancelAnimationFrame(this._frameId);
			this._frameId = -1;
			this._paused = true;
		}
	}

	tick() {
		if (!this._paused) {
			this._frameId = window.requestAnimationFrame(() => this.tick());

			this.tickables.forEach(tick => tick(this.api));
			this.api.ctx.actors.forEach(actor => actor.tick(this.api.ctx, actor.mesh));
			this.api.ctx.renderer.render(this.api.ctx.scene, this.api.ctx.camera);

			this.setState({ api: this.api });
		}
	}

	render() {
		return (
			<div className="flex-expand">
				<div className="fill flex-row padded">
					<div ref={this.containerRef} />
					<CodeWindow keys={this.api.ctx.bb.input.keys} />
				</div>
			</div>
		);
	}
}

export default Game;
