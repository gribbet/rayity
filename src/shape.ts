import {Code, Expression} from "./expression";

export type Shape = {
	readonly id: number,
	readonly body: Code,
	readonly dependencies: Shape[],
	readonly call: (_: Expression) => Expression,
}

let lastId = 1;
function shape(
	body: string,
	dependencies: Shape[] = []) {

	let id = lastId++;
	return {
		body: body,
		dependencies: dependencies,
		id: id,
		call: (x: Expression) => `f${id}(${x})`
	};
}

export function unitSphere(): Shape {
	return shape(`return length(p) - 1.0;`);
}

export function plane(normal: Expression, offset: Expression) {
	return shape(`return dot(p, ${normal}) + ${offset}.x;`);
}

export function translate(x: Expression, f: Shape) {
	return shape(`return ${f.call(`p - ${x}`)};`, [f]);
}

export function scale(x: Expression, f: Shape) {
	return shape(`return ${f.call(`p / ${x}.x`)} * ${x}.x;`, [f]);
}