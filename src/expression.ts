export type Expression = string;
export type Code = string;

export function value(
	x: number = 0,
	y: number = x,
	z: number = y): Expression {
	return `vec3(${x.toPrecision(10)}, ${y.toPrecision(10)}, ${z.toPrecision(10)})`;
}

export function variable(name: string): Expression {
	return name;
}