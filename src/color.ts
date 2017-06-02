export type Color = {
	red: number,
	green: number,
	blue: number
}

export function color(red: number, green: number, blue: number) {
	return {
		red: red,
		green: green,
		blue: blue
	};
}