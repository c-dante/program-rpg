import { Vector3 } from 'three';

import { TimeStep } from './gameContext';
import { ContextApi } from './api';
import { Controls, SCALE } from './config';

export const cameraControls = () => (api: ContextApi, { delta }: TimeStep) => {
	const { keys } = api.ctx.bb.input.globalInputs;

	// Move around
	const v = new Vector3();
	if (keys[Controls.CameraUp]?.down) {
		v.y += 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraDown]?.down) {
		v.y -= 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraLeft]?.down) {
		v.x -= 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraRight]?.down) {
		v.x += 0.1 * SCALE * delta;
	}
	api.ctx.camera.position.add(
		v.normalize().multiplyScalar(keys[Controls.CameraBoost]?.down ? 5 : 0.5)
	);
}
