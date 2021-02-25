import fp from "lodash/fp";
import { BoxGeometry, Mesh, MeshBasicMaterial, Raycaster } from "three";
import { Actor, Context, makeActor, Tick } from "./actor";
import { Colors, SCALE } from "./config";

export const makeBox = (color = Colors.Purple) => new Mesh(
	new BoxGeometry(),
	new MeshBasicMaterial({ color })
);

// Typing this is annoying
export type MakeEntityProps = {
	x: number,
	y: number,
	tick: Tick,
	color: number,
	state?: any,
} & Actor;
export const makeEntity = (
	{ actors, scene }: Context,
	{
		mesh = makeBox(), // n.b., not a memory leak on chrome I guess
		x = 0,
		y = 0,
		tick = fp.noop,
		state,
		...actorProps
	}: Partial<MakeEntityProps> = {}
): Actor => {
	mesh.position.x = x;
	mesh.position.y = y;
	mesh.scale.multiplyScalar(SCALE);
	scene.add(mesh);

	const entity = makeActor({
		state,
		mesh,
		tick,
		...actorProps
	});
	actors.push(entity);

	return entity;
};

const disposeMesh = (mesh: Mesh): void => {
	mesh.geometry.dispose();
	if (fp.isArray(mesh.material)) {
		mesh.material.forEach(x => x.dispose());
	} else {
		mesh.material.dispose();
	}
}

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

	// @todo: determine shader & geometry lifetimes
	// Maybe a "Disposables" idea?
	remove.forEach(({ mesh }) => disposeMesh(mesh));
};

export const remove = (
	ctx: Context,
	actor: Actor
): void => {
	let disposeScene = false
	ctx.actors = ctx.actors.filter(x => {
		if (x === actor) {
			disposeScene = true;
			return false;
		}
		return true;
	});

	if (disposeScene) {
		ctx.scene.remove(actor.mesh);
	}

	// @todo: determine shader & geometry lifetimes
	// Maybe a "Disposables" idea?
	disposeMesh(actor.mesh);
}

/**
 * Annoyingly mutable object
 * Would love to mark things as mut better
 */
export interface ContextApi {
	readonly ctx: Context;
	readonly raycaster: Raycaster;
	readonly makeEntity: (props: Partial<MakeEntityProps>) => Actor;
	readonly remove: (actor: Actor) => void;
	readonly removeByTags: (tags: string[]) => void;
}
export const withContext = (ctx: Context): ContextApi => ({
	ctx,
	raycaster: new Raycaster(),
	makeEntity: fp.partial(makeEntity, [ctx]),
	remove: fp.partial(remove, [ctx]),
	removeByTags: fp.partial(removeByTags, [ctx]),
});
