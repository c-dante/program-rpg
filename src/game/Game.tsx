import React, { createRef } from 'react';
import type { RefObject } from 'react';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { Camera, Renderer } from 'three';

import { Colors } from './style';
import { Actor, withContext} from './actor';
import CodeWindow from './CodeWindow';


const setUpScene = (ctx) => {
	const api = withContext(ctx);
	console.debug(api);

	const cube = api.makeEntity({
		x: 1,
		y: 1,
		tick(self) {
			self.rotation.x += 0.01;
			self.rotation.y += 0.01;
		}
	});

	const other = api.makeEntity({
		x: -1,
		y: -1,
		color: Colors.Red,
		tick(self) {
			self.rotation.x += 0.01;
			self.rotation.y += 0.01;
		}
	});
	console.debug({ cube, other });

	ctx.camera.position.z = 5;

	return api;
}

export interface Props {}

class Game extends React.Component<Props> {
	containerRef: RefObject<HTMLDivElement>;
	scene: Scene;
	camera: Camera;
	renderer: Renderer;
	actors: Actor[];

	_paused: boolean = true;
	_frameId: number = 0;

	constructor(props: Props) {
		super(props);
		const width = 480;
		const height = 480;

		this.containerRef = createRef<HTMLDivElement>();
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
		this.renderer = new WebGLRenderer();
		this.renderer.setSize(width, height);

		this.actors = [];

		// ---- Less bleh ----- //
		setUpScene({
			scene: this.scene,
			camera: this.camera,
			actors: this.actors,
		});
	}

	componentDidMount() {
		this.containerRef.current?.appendChild(this.renderer.domElement);
		this.play();
	}

	componentWillUnmount() {
		this.pause();
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

			this.actors.forEach(actor => actor.tick(actor.mesh));

			this.renderer.render(this.scene, this.camera);
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
