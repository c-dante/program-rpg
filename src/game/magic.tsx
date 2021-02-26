import { Vector3 } from "three";
import { TimeStep } from "./actor";
import { ContextApi, makeBox } from "./api";
import { SCALE, Colors, Tag } from "./config";

export type SpellFn = () => (delta: number, position: Vector3, velocity: Vector3) => void;

export type Spell = {
	source: string,
	fn: SpellFn
};

// const basicSpellLogic = (
// 	delta: number,
// 	position: Vector3,
// 	velocity: Vector3,
// ) => {
// 	position.add(velocity.multiplyScalar(delta));
// }

export const compileSpell = (incantation: string) => ({
	source: incantation,
	// eslint-disable-next-line no-new-func
	fn: new Function(incantation) as any,
});

export const basicSpell: Spell = compileSpell(`return (delta, position, velocity) => {
	position.add(velocity.multiplyScalar(delta));
};`);

export const spellCaster = (spellLogic: Spell = basicSpell) => {
	const cooldown = 20;
	let last = 0;
	return (api: ContextApi, { time }: TimeStep) => {
		if (
			api.ctx.targeting
			&& api.ctx.bb.player
			&& api.ctx.bb.input.mouse.down
			&& time - last >= cooldown
		) {
			last = time;

			const target = api.ctx.targeting.point.clone().setZ(0);
			const origin = api.ctx.bb.player.mesh.position.clone().setZ(0);
			const velocity = target.sub(origin)
					.normalize()
					.multiplyScalar(0.05 * SCALE);

			const entityLogic = spellLogic.fn();
			api.makeEntity({
				x: api.ctx.bb.player.mesh.position.x,
				y: api.ctx.bb.player.mesh.position.y,
				// ---- @todo: phys
				state: {
					velocity,
					life: 500,
				},
				// ----
				mesh: makeBox(Colors.Red),
				tags: new Set([Tag.Other]),
				name: 'some-enemy',
				tick(_, { delta }, actor) {
					const { mesh, state } = actor;
					if (state.life <= 1) {
						api.remove(actor)
						return;
					}

					// Phys baby
					state.life--;
					try {
						entityLogic(delta, mesh.position, state.velocity)
					} catch (error) {
						console.warn('Spell Exception', error);
						state.life = 0;
					}
				}
			});
		}
	};
};
