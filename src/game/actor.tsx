import fp from 'lodash/fp';
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import type { Renderer, Scene, Camera } from 'three';

import { Colors } from './config';

export type Tick = (ctx: Context, self: Mesh) => void;
export interface Tickable {
	tick: Tick;
}
export interface Named {
	name: string;
}

export interface Actor extends Tickable, Named {
	mesh: Mesh;
};

export type Blackboard = {} & any;

export type Context = {
	actors: Actor[],
	camera: Camera,
	scene: Scene,
	renderer: Renderer,
	bb: Blackboard,
};
export const makeContext = ({
	renderer,
	camera,
	scene,
	actors = [],
	bb = {},
}: Partial<Context> & Pick<Context, 'camera' | 'scene' | 'renderer'>): Context => ({
	renderer,
	actors,
	camera,
	scene,
	bb,
});

export type MakeActorProps = Actor;
export const makeActor = ({
	mesh,
	name = `actor-${Math.random().toString(16).slice(2)}`,
	tick = fp.noop,
}: Partial<MakeActorProps> & Pick<MakeActorProps, 'mesh'>): Actor => ({
	tick,
	mesh,
	name,
});

// ----

// Typing this is annoying
export type MakeEntityProps = {
	x: number,
	y: number,
	tick: Tick,
	color: number,
};
export const makeEntity = (
	{ actors, scene }: Context,
	{
		x = 0,
		y = 0,
		tick = fp.noop,
		color = Colors.Purple,
	}: Partial<MakeEntityProps> = {}
) => {
	const mesh = new Mesh(
		new BoxGeometry(),
		new MeshBasicMaterial({ color })
	);
	mesh.position.x = x;
	mesh.position.y = y;
	scene.add(mesh);

	const entity = makeActor({ mesh, tick });
	actors.push(entity);

	return entity;
};

export interface ContextApi {
	makeEntity: (props: Partial<MakeEntityProps>) => Actor;
}
export const withContext = (ctx: Context): ContextApi => ({
	makeEntity: fp.partial(makeEntity, [ctx]),
});
