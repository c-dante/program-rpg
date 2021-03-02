import fp from 'lodash/fp';
import { Vector3 } from 'three';
import { ContextApi, makeBox, MakeEntityProps } from './api';
import { Colors, Tag, SCALE } from './config';
import { TimeStep } from './gameContext';

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
);

export const makeOther = (
	api: ContextApi,
	entityProps: Partial<MakeEntityProps> = {},
) => {
	// Make the other near the player
	const origin = fp.has(['x', 'y'], entityProps)
		? fp.pick(['x', 'y'], entityProps)
		: randomPointNear(api.ctx.bb.player?.mesh?.position ?? new Vector3(), 10, 2);


	api.makeEntity({
		x: origin.x,
		y: origin.y,
		mesh: makeBox(Colors.Red),
		tags: new Set([Tag.Other]),
		name: 'some-enemy',
		tick(ctx, _, { mesh }) {
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;

			// Walk toward cube
			const speed = 0.1 * SCALE;
			if (ctx.bb.player && mesh.position.distanceTo(ctx.bb.player.mesh.position) > speed) {
				const v = ctx.bb.player.mesh.position.clone()
					.sub(mesh.position)
					.normalize()
					.multiplyScalar(speed);
					mesh.position.add(v);
			}
		},

		// And override
		...entityProps,
	});
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
			console.log('spawn', pop);
			const { x, y } = randomPointNear(den.mesh.position, 15, 3);
			makeOther(api, {
				x,
				y,
			});
			lastSpawn = time.time;
		}
	};
};
