import fp from 'lodash/fp';
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import type { Scene, Camera } from 'three';

import { Colors } from './style';

export type Tick = (self: Mesh) => void;
export interface Tickable {
	tick: Tick;
}

export interface Actor extends Tickable {
	mesh: Mesh;
};

export type Context = {
	actors: Actor[],
	camera: Camera,
	scene: Scene,
};

export const makeActor = (mesh: Mesh, tick: Tick = () => {}): Actor => ({
	tick,
	mesh,
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

	const entity = makeActor(mesh, tick);
	actors.push(entity);

	return entity;
};

export interface ContextApi {
	makeEntity: (props: Partial<MakeEntityProps>) => Actor;
}
export const withContext = (ctx: Context): ContextApi => ({
	makeEntity: fp.partial(makeEntity, [ctx]),
});
