export type Code = string;
export type Expression = {
	readonly id: string,
	readonly body: Code,
	readonly dependencies: Expression[],
	readonly toString: () => string;
}

export function expression(
	body: Code,
	dependencies: Expression[] = []): Expression {

	let id = generateId(body);
	return {
		id: id,
		body: body,
		dependencies: dependencies,
		toString: () => id
	};
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