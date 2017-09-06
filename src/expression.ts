/**
 * Functionality related to managing GLSL expressions
 */

/** GLSL code */
export type Code = string;

/** GLSL expression. May depend on other expression */
export interface Expression {
	/** Unique hash for the expression */
	readonly id: string;
	/** GLSL code for the expression */
	readonly body: Code;
	/** Dependent expressions */
	readonly dependencies: Expression[];
	/** toString to support generation through string templates */
	readonly toString: () => string;
}

let context: Expression[] = [];

/** Create an [[Expression]] */
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

/** A constant-valued [[Expression]] */
export function value(
	x: number = 0,
	y: number = x,
	z: number = y): Expression {
	return expression(`vec3(${x.toPrecision(10)}, ${y.toPrecision(10)}, ${z.toPrecision(10)})`);
}

/** An expression which is equal to a named variable */
export function variable(name: string): Expression {
	return expression(name);
}

/** A random value */
export function random(seed: Expression): Expression {
	return expression(`fract(sin(dot(${seed} + 1000.0, vec3(12.9898, 78.233, 26.724))) * 43758.5453)`);
}

/** Minimum of x, y, and z components */
export function minNorm(v: Expression): Expression {
	return expression(`min(min(${v}.x, ${v}.y), ${v}.z)`);
}