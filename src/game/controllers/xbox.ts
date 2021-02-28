import fp from 'lodash/fp';

export enum XboxButtons {
	// 0-3
	A,
	B,
	X,
	Y,

	// 4-5
	LeftShoulder,
	RightShoulder,

	// 6-7 (also range)
	LeftTrigger,
	RightTrigger,

	// 8-9
	Back,
	Start,

	// 10-11
	LeftSick,
	RightSick,

	// 12-15
	DpadLeft,
	DpadRight,
	DpadUp,
	DpadDown,

	// 16
	XboxButton,
};

export const ButtonNames = Object.keys(XboxButtons).filter(fp.flow(
	Number,
	fp.isNaN
));

export const XboxButtonMap: Record<number, XboxButtons> = ButtonNames.reduce((acc, name, idx) => ({
	...acc,
	[idx]: name,
}), {});
