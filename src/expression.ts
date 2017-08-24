/**
 * GLSL Code
 */
export type Code = string;
export interface Expression {
	readonly id: string,
	readonly body: Code,
	readonly dependencies: Expression[],
	readonly toString: () => string;
}

let context: Expression[] = [];

export function expression(body: Code): Expression {
	let id = generateId(body);
	let self = {
		id: id,
		body: body,
		dependencies: context,
		toString: () => {
			if (context.indexOf(self) === -1)
				context.push(self);
			return id;
		}
	};
	context = [];
	return self;
}

function generateId(body: Code): string {
	return "a" + hash(body).toString(16);
}

function hash(x: string): number {
	let hash = 5381;

	for (let i = 0; i < x.length; i++)
		hash = (hash * 33) ^ x.charCodeAt(i);

	return hash >>> 0;
}

export function value(
	x: number = 0,
	y: number = x,
	z: number = y): Expression {
	return expression(`vec3(${x.toPrecision(10)}, ${y.toPrecision(10)}, ${z.toPrecision(10)})`);
}

export function variable(name: string): Expression {
	return expression(name);
}

export function random(x: Expression): Expression {
	return expression(`fract(sin(dot(${x} + 1000.0, vec3(12.9898, 78.233, 26.724))) * 43758.5453)`);
}

export function minNorm(x: Expression): Expression {
	return expression(`min(min(${x}.x, ${x}.y), ${x}.z)`);
}