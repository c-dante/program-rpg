import fp from 'lodash/fp';
import type { Renderer, Scene, Camera, Mesh, Intersection } from 'three';
import { Inputs, globalInputs } from './InputContext';

export type TimeStep = {
	time: number,
	delta: number,
}

export type Tick = (ctx: Context, step: TimeStep, self: Actor) => void;
export interface Tickable {
	tick: Tick;
}
export interface Named {
	name: string;
}
export interface Tagged {
	tags: Set<String>;
}

export interface Actor extends Tickable, Named, Tagged {
	mesh: Mesh;
	state?: any;
	// @todo: Disposable
};

export type GameInput = {
	globalInputs: Inputs,
	mouse: {
		x: number,
		y: number,
	}
};

export type Blackboard = {
	readonly input: GameInput,
	player?: Actor,
	[x: string]: any,
};

export type Context = {
	// filters and changes each tick
	actors: Actor[],
	targets: Intersection[],
	targeting?: Intersection,
	// Fixed things
	readonly camera: Camera,
	readonly scene: Scene,
	readonly renderer: Renderer,
	readonly bb: Blackboard,
};
export const makeContext = ({
	renderer,
	camera,
	scene,
	actors = [],
	bb = {
		input: { globalInputs, mouse: { x: 0, y: 0 }}
	},
	targets = [],
}: Partial<Context> & Pick<Context, 'camera' | 'scene' | 'renderer'>): Context => ({
	renderer,
	actors,
	camera,
	scene,
	bb,
	targets,
});

export type MakeActorProps = Actor;
export const makeActor = ({
	mesh,
	name = `actor-${Math.random().toString(16).slice(2)}`,
	tick = fp.noop,
	tags = new Set(),
	state,
}: Partial<MakeActorProps> & Pick<MakeActorProps, 'mesh'>): Actor => {
	mesh.name = name;
	return {
		tick,
		mesh,
		name,
		tags,
		state,
	};
}
