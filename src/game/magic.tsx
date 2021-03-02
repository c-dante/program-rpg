import { BoxGeometry, Mesh, MeshBasicMaterial, Vector3, Spherical } from 'three';
import { TimeStep } from './gameContext';
import { ContextApi } from './api';
import { SCALE, Colors, Tag } from './config';
import { axisPastDeadzone } from './inputs/globalContext';

const SpellEnv = {
	Vector3,
	Spherical,
};

export type SpellFn = (_: typeof SpellEnv) => (delta: number, position: Vector3, velocity: Vector3) => void;

export type Spell = {
	source: string,
	fn: SpellFn
};

export const invokeNewSpell = (spell: SpellFn) => spell(SpellEnv);

export const compileSpell = (incantation: string) => {
	// eslint-disable-next-line no-new-func
	const fn = new Function(`"use strict";return ({ Vector3, Spherical }) => { ${incantation} }`)() as SpellFn;

	// Ensure we can evoke
	invokeNewSpell(fn);

	// Return the object
	return {
		source: incantation,
		fn,
	};
};

export const spellBook: Spell[] = [
	compileSpell(
`return (delta, position, velocity) => {
  position.addScaledVector(velocity, delta);
};`),
	compileSpell(
`let theta = 0;
const up = new Vector3(0.0, 0.0, 1.0);
return (delta, position, velocity) => {
  position.addScaledVector(velocity, delta);
  velocity.applyAxisAngle(up, theta);
  theta += 0.0001;
};`),
compileSpell(
`const up = new Vector3(0.0, 0.0, 1.0);
const theta = Math.random() * Math.PI * 2;
const fixedVelocity = new Vector3(1.0, 1.0, 0.0)
	.applyAxisAngle(up, theta)
	.normalize()
	.multiplyScalar(0.03);

return (delta, position, velocity) => {
	position.addScaledVector(fixedVelocity, delta);
};`),
];

export const spellCaster = (spellLogic: Spell = spellBook[0]) => {
	const cooldown = 100;
	let last = 0;
	return (api: ContextApi, { time }: TimeStep) => {
		const [axisX, axisY] = api.ctx.bb.input.globalInputs.gamepads?.[0]?.axes?.slice(2) ?? [0, 0];
		const useAxis = axisPastDeadzone(axisX, axisY);
		if (
			api.ctx.targeting
			&& api.ctx.bb.player
			&& (
				api.ctx.bb.input.globalInputs.pointers?.[1]?.down
				|| useAxis
			)
			&& time - last >= cooldown
		) {
			last = time;

			const entityLogic = invokeNewSpell(spellLogic.fn);
			const velocity = (() => {
				if (useAxis) {
					return new Vector3(axisX, -axisY);
				}

				const target = api.ctx.targeting.point.clone().setZ(0);
				const origin = api.ctx.bb.player.mesh.position.clone().setZ(0);
				return target.sub(origin);
			})();

			// Normalize the velocity
			velocity
				.normalize()
				.multiplyScalar(0.05 * SCALE);

			api.makeEntity({
				x: api.ctx.bb.player.mesh.position.x,
				y: api.ctx.bb.player.mesh.position.y,
				// ---- @todo: phys
				state: {
					velocity,
					life: 500,
				},
				// ----
				mesh: new Mesh(
					new BoxGeometry(0.1, 0.1, 0.1),
					new MeshBasicMaterial({ color: Colors.Red })
				),
				tags: new Set([ Tag.Bullet]),
				tick(_, { delta }, actor) {
					const { mesh, state } = actor;
					if (state.life <= 1) {
						api.remove(actor);
						return;
					}

					// Phys baby
					state.life--;
					try {
						entityLogic(delta, mesh.position, state.velocity);
						const collide = api.ctx.actors.find(
							x => x.tags.has(Tag.Other)
								&& x.mesh.position.distanceTo(mesh.position) <= 0.8
						);
						if (collide) {
							api.removeAll([collide, actor]);
						}
					} catch (error) {
						console.warn('Spell Exception', error);
						state.life = 0;
					}
				}
			});
		}
	};
};
