import fp from 'lodash/fp';
import { BoxGeometry, Mesh, MeshBasicMaterial, Raycaster } from 'three';
import { Actor, Context, makeActor, Tick, TimeStep } from './gameContext';
import { Colors } from './config';

// I want "into Set" -- gimme something that can get to Set<T>, and Set
type IntoSet<T> = Set<T> | T[];

// -------- Set/helpers
// Would use const but <T>() => overlaps w/ tsx
function setIntersects<T>(a: Set<T>, b: Set<T>): boolean {
	const [l, r] = fp.sortBy('size', [a, b]);
	for (const elt of l) {
		if (r.has(elt)) {
			return true;
		}
	}
	return false;
}
// console.log(setIntersects(
// 	new Set([1, 2, 3]),
// 	new Set([2]),
// ));
// console.log(setIntersects(
// 	new Set([1, 2, 3]),
// 	new Set([5, 6, 7, 8, 9, 10, 11]),
// ));
// --------

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

	// @todo: determine shader & geometry lifetimes
	// Maybe a "Disposables" idea?
	remove.forEach(({ mesh }) => disposeMesh(mesh));
};

export const removeAll = (
	ctx: Context,
	actors: Actor[],
): void => {
	const actorSet = new Set(actors);
	ctx.actors = ctx.actors.filter(x => !actorSet.has(x));

	// @todo: determine shader & geometry lifetimes
	// Maybe a "Disposables" idea?
	ctx.scene.remove(...actors.map(x => x.mesh));
	actors.forEach(x => disposeMesh(x.mesh));
};

export const remove = (
	ctx: Context,
	actor: Actor
): void => removeAll(ctx, [actor]);

const getByTags = (ctx: Context, tags: IntoSet<string>): Actor[] => {
	const tagSet: Set<string> = fp.isArray(tags)
		? new Set(tags)
		: tags as Set<string>;
	return ctx.actors.filter(
		x => setIntersects(x.tags, tagSet),
	);
};

/**
 * Annoyingly mutable object
 * Would love to mark things as mut better
 */
export interface ContextApi {
	readonly ctx: Context;
	readonly raycaster: Raycaster;

	makeEntity: (props: Partial<MakeEntityProps>) => Actor;
	remove: (actor: Actor) => void;
	removeAll: (actor: Actor[]) => void;
	removeByTags: (tags: string[]) => void;
	getByTags: (tags: IntoSet<string>) => Actor[];
};

export const withContext = (ctx: Context): ContextApi => ({
	ctx,
	raycaster: new Raycaster(),
	makeEntity: fp.partial(makeEntity, [ctx]),
	remove: fp.partial(remove, [ctx]),
	removeAll: fp.partial(removeAll, [ctx]),
	removeByTags: fp.partial(removeByTags, [ctx]),
	getByTags: fp.partial(getByTags, [ctx]),
});

export type AppTick = (api: ContextApi, step: TimeStep) => void;
