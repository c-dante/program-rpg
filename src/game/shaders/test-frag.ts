const source = `varying vec2 vUv;

// rg gradient
vec4 simple_gradient(vec2 position, vec2 gridcell) {
	return vec4(
		position.yx * 100.0,
		1.0,
		1.0
	);
}


vec4 ground(vec2 position, vec2 gridcell) {
	return vec4(gridcell.xy, 1.0, 1.0);
}


// Simple grid overlay combine
void main( void ) {
	vec2 position = - 1.0 + 2.0 * vUv;
	vec2 gridcell = mod(floor(position.xy * 100000.0), 80.0) / 80.0;
	vec4 color = simple_gradient(position, gridcell);

	if (gridcell.x == 0.0 || gridcell.y == 0.0) {
		gl_FragColor = -color;
	} else {
		gl_FragColor = color;
	}
}`;

export default source;
