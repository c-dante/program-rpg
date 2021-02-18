import React, { createRef } from 'react';
import type { RefObject } from 'react';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { Camera, Renderer } from 'three';

export interface Props {}

class Game extends React.Component<Props> {
	containerRef: RefObject<HTMLDivElement>;
	scene: Scene;
	camera: Camera;
	renderer: Renderer;
	cube: Mesh;

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

		// ---- Bleh ----- //
		this.cube = new Mesh(
			new BoxGeometry(),
			new MeshBasicMaterial({ color: 0x690069 })
		);
		this.scene.add(this.cube);
		this.camera.position.z = 2;
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

			this.cube.rotation.x += 0.01;
			this.cube.rotation.y += 0.01;

			this.renderer.render(this.scene, this.camera);
		}
	}

	render() {
		return (
			<div ref={this.containerRef} />
		);
	}
}

export default Game;
