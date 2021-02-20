import React, { createRef } from 'react';
import type { RefObject } from 'react';
import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import fp from 'lodash/fp';

import { Colors, Controls } from './config';
import { Context, withContext, makeContext } from './actor';
import CodeWindow from './CodeWindow';


const setUpScene = (ctx) => {
	const api = withContext(ctx);

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
				v.y += 0.1;
			}
			if (keys[Controls.Down]) {
				v.y -= 0.1;
			}
			if (keys[Controls.Left]) {
				v.x -= 0.1;
			}
			if (keys[Controls.Right]) {
				v.x += 0.1;
			}
			self.position.add(v.normalize().multiplyScalar(0.05));
		}
	});

	const other = api.makeEntity({
		x: -1,
		y: -1,
		color: Colors.Red,
		tick(ctx, self) {
			self.rotation.x += 0.01;
			self.rotation.y += 0.01;

			// Walk toward cube
			if (self.position.distanceTo(ctx.bb.cube.mesh.position) > 0.01) {
				const v = ctx.bb.cube.mesh.position.clone()
					.sub(self.position)
					.normalize()
					.multiplyScalar(0.01);
				self.position.add(v);
			}
		}
	});

	// Blackboard because why not
	ctx.bb.cube = cube;
	ctx.bb.other = other;

	ctx.camera.position.z = 5;

	return api;
}

export interface Props {}

class Game extends React.Component<Props> {
	containerRef: RefObject<HTMLDivElement>;
	ctx: Context;

	_paused: boolean = true;
	_frameId: number = 0;
	_unregister: () => void = fp.noop;

	constructor(props) {
		super(props);

		// Init in constructor
		const width = 480;
		const height = 480;
		this.ctx = makeContext({
			scene: new Scene(),
			camera: new PerspectiveCamera(75, width / height, 0.1, 1000),
			renderer: new WebGLRenderer(),
		});
		this.containerRef = createRef<HTMLDivElement>();
		this.ctx.renderer.setSize(width, height);
		this.ctx.bb.input = {
			keys: {},
		};
	}

	componentDidMount() {
		// Window events in the mount/unmount sections
		const _onKeyUp = (evt) => {
			this.ctx.bb.input.keys[evt.code] = false;
		}
		const _onKeyDown = (evt) => {
			this.ctx.bb.input.keys[evt.code] = true;
		}

		window.addEventListener('keyup', _onKeyUp);
		window.addEventListener('keydown', _onKeyDown);
		this._unregister = () => {
			window.removeEventListener('keyup', _onKeyUp);
			window.removeEventListener('keydown', _onKeyDown);
		};

		// ---- Mount Init ----- //
		this.containerRef.current?.appendChild(this.ctx.renderer.domElement);
		setUpScene(this.ctx);
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

			this.ctx.actors.forEach(actor => actor.tick(this.ctx, actor.mesh));

			this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
		}
	}

	render() {
		return (
			<div className="flex-row padded">
				<div ref={this.containerRef} />
				<CodeWindow />
			</div>
		);
	}
}

export default Game;
