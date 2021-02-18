import type { Mesh } from 'three';

export type Tick = (self: Mesh) => void;
export interface Tickable {
	tick: Tick;
}

export interface Actor extends Tickable {
	mesh: Mesh;
};

export const makeActor = (mesh: Mesh, tick: Tick = () => {}): Actor => ({
	tick,
	mesh,
});
