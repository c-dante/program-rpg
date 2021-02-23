const source = `varying vec2 vUv;

void main( void ) {
	vec2 position = - 1.0 + 2.0 * vUv;

	// float red = abs( sin( position.x * position.y ) );
	// float green = abs( sin( position.x * position.y ) );
	// float blue = abs( sin( position.x * position.y ) );
	// gl_FragColor = vec4( red, green, blue, 1.0 );

	// if (
	// 	mod(floor(vUv.x * 100000.0), 100.0) == 0.
	// 	|| mod(floor(vUv.y* 100000.0), 100.0) == 0.
	// ) {
	// 		gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
	// } else {
	// 		gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
	// }

	if (
		mod(floor(position.x * 100000.0), 80.0) == 0.0
		|| mod(floor(position.y * 100000.0), 80.0) == 0.0
	) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	} else {
		gl_FragColor = vec4(
			position.yx * 100.0,
			1.0,
			1.0
		);
	}

}`;

export default source;
