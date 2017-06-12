export type Expression = string;
export type Code = string;

export function value(
	x: number = 0,
	y: number = 0,
	z: number = 0): Expression {
	return `vec3(${x.toPrecision(6)}, ${y.toPrecision(6)}, ${z.toPrecision(6)})`;
}

export function variable(name: string): Expression {
	return name;
}