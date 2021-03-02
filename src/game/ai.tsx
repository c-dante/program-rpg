import { ContextApi } from './api';
import { TimeStep } from './gameContext';

// const makeOther = (api: ContextApi) => {
// 	// Make the other near the player
// 	const origin = (api.ctx.bb.player?.mesh?.position ?? new Vector3()).clone()
// 		.add(
// 			new Vector3().setFromSphericalCoords(Math.random() * 4 + 3, Math.random() * Math.PI * 2, Math.PI/2)
// 		);

// 	api.makeEntity({
// 		x: origin.x,
// 		y: origin.y,
// 		mesh: makeBox(Colors.Red),
// 		tags: new Set([Tag.Other]),
// 		name: 'some-enemy',
// 		tick(ctx, _, { mesh }) {
// 			mesh.rotation.x += 0.01;
// 			mesh.rotation.y += 0.01;

// 			// Walk toward cube
// 			const speed = 0.01 * SCALE;
// 			if (ctx.bb.player && mesh.position.distanceTo(ctx.bb.player.mesh.position) > speed) {
// 				const v = ctx.bb.player.mesh.position.clone()
// 					.sub(mesh.position)
// 					.normalize()
// 					.multiplyScalar(speed);
// 					mesh.position.add(v);
// 			}
// 		}
// 	});
// };

export const spawner = () => (api: ContextApi, delta: TimeStep) => {

};
