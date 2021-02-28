import { Vector3 } from 'three';

import { TimeStep } from './actor';
import { ContextApi } from './api';
import { Controls, SCALE } from './config';

export const cameraControls = () => (api: ContextApi, { delta }: TimeStep) => {
	const keys = api.ctx.bb.input.keys;

	// Move around
	const v = new Vector3();
	if (keys[Controls.CameraUp]) {
		v.y += 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraDown]) {
		v.y -= 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraLeft]) {
		v.x -= 0.1 * SCALE * delta;
	}
	if (keys[Controls.CameraRight]) {
		v.x += 0.1 * SCALE * delta;
	}
	api.ctx.camera.position.add(
		v.normalize().multiplyScalar(keys[Controls.CameraBoost] ? 5 : 0.5)
	);
}
