import fp from 'lodash/fp';
import { Vector3 } from 'three';
import { ContextApi, makeBox, MakeEntityProps } from './api';
import { Colors, Tag, SCALE } from './config';
import { Tick, TimeStep } from './gameContext';

const randomPointNear = (
	origin: Vector3,
	radius: number,
	innerRadius: number = 0
): Vector3 => origin.clone()
.add(
	new Vector3().setFromSphericalCoords(
		Math.random() * (radius - innerRadius) + innerRadius,
		Math.random() * Math.PI * 2, Math.PI/2
	)
	.setZ(0)
);

function addAllMut<T>(self: Set<T>, from: Iterable<T>): Set<T> {
	for (const elt of from) {
		self.add(elt);
	}
	return self;
}

const chasePlayer: () => Tick = () => (ctx, { delta }, { mesh }) => {
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.01;

	// Walk toward cube
	const speed = 0.05;
	if (ctx.bb.player && mesh.position.distanceTo(ctx.bb.player.mesh.position) > speed) {
		const v = ctx.bb.player.mesh.position.clone()
			.sub(mesh.position)
			.normalize()
			.multiplyScalar(speed * SCALE * delta);
			mesh.position.add(v);
	}
};

export const makeOther = (
	api: ContextApi,
	entityProps: Partial<MakeEntityProps> = {},
) => {
	// Make the other near the player
	const origin = fp.has(['x', 'y'], entityProps)
		? fp.pick(['x', 'y'], entityProps)
		: randomPointNear(api.ctx.bb.player?.mesh?.position ?? new Vector3(), 10, 2);

	const {
		tags = new Set(),
		tick = chasePlayer(),
		...pass
	} = entityProps;
	api.makeEntity({
		tags: addAllMut(new Set([Tag.Other]), tags),

		x: origin.x,
		y: origin.y,
		mesh: makeBox(Colors.Red),
		name: 'some-enemy',
		tick,

		// And override
		...pass,
	});
};


const wander: () => Tick = () => {
	const speed = 0.02;
	let nextPoint: Vector3 | undefined;
	const heading = new Vector3(1.0, 0.0, 0.0);
	return (ctx, { delta }, { mesh }) => {
		if (!nextPoint || nextPoint.distanceTo(mesh.position) <= speed) {
			nextPoint = randomPointNear(mesh.position, 3, 1);
		}

		heading.copy(nextPoint)
			.setZ(0)
			.sub(mesh.position)
			.normalize()
			.setZ(0);
		mesh.lookAt(nextPoint);
		mesh.position.add(heading.multiplyScalar(speed * SCALE * delta));
	};
};


type SpawnerProps = {
	api: ContextApi,
	maxPop?: number,
};
// Make a spawner den (?)
export const spawner = ({
	api,
	maxPop = 10,
	spawnTime = 1500,
}: SpawnerProps & Record<string, any>) => {
	console.log('Make Spawner', { api, maxPop });
	const den = api.makeEntity({

	});
	let lastSpawn = 0;
	const spawnTags = new Set(['spawner', den.mesh.uuid]);
	return (api: ContextApi, time: TimeStep) => {
		const pop = api.getByTags(spawnTags);
		if (time.time - lastSpawn >= spawnTime && pop.length < maxPop) {
			const { x, y } = randomPointNear(den.mesh.position, 15, 3);
			makeOther(api, {
				x,
				y,
				tags: spawnTags,
				tick: wander(),
			});
			lastSpawn = time.time;
		}
	};
};
