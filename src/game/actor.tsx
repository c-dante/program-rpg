import fp from 'lodash/fp';
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import type { Renderer, Scene, Camera } from 'three';

import { Colors, SCALE } from './config';

export type Tick = (ctx: Context, self: Mesh) => void;
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
	tags = new Set(),
}: Partial<MakeActorProps> & Pick<MakeActorProps, 'mesh'>): Actor => ({
	tick,
	mesh,
	name,
	tags,
});

// ----

// Typing this is annoying
export type MakeEntityProps = {
	x: number,
	y: number,
	tick: Tick,
	color: number,
	tags: Set<String>,
};
export const makeEntity = (
	{ actors, scene }: Context,
	{
		x = 0,
		y = 0,
		tick = fp.noop,
		color = Colors.Purple,
		tags = new Set(),
	}: Partial<MakeEntityProps> = {}
): Actor => {
	const mesh = new Mesh(
		new BoxGeometry(),
		new MeshBasicMaterial({ color })
	);
	mesh.position.x = x;
	mesh.position.y = y;
	mesh.scale.multiplyScalar(SCALE);
	scene.add(mesh);

	const entity = makeActor({ mesh, tick, tags });
	actors.push(entity);

	return entity;
};

export const removeByTags = (
	ctx: Context,
	tags: string[],
): void => {
	const [remove, keep] = fp.partition(
		(a: Actor) => tags.every(tag => a.tags.has(tag)),
		ctx.actors
	);
	ctx.actors = keep;
	ctx.scene.remove(...remove.map(x => x.mesh));
};

export interface ContextApi {
	ctx: Context;
	makeEntity: (props: Partial<MakeEntityProps>) => Actor;
	removeByTags: (tags: string[]) => void;
}
export const withContext = (ctx: Context): ContextApi => ({
	ctx,
	makeEntity: fp.partial(makeEntity, [ctx]),
	removeByTags: fp.partial(removeByTags, [ctx]),
});
