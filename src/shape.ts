import {Code, Expression, value} from "./expression";

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
		call: (x: Expression) => `shape${id}(${x})`
	};
}

export function unitSphere(): Shape {
	return shape(`return length(p) - 1.0;`);
}

export function unitBox(): Shape {
	return shape(`
		vec3 d = abs(p) - vec3(1, 1, 1);
		return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));`);
}

export function unitTetrahedon(): Shape {
	return shape(`
		return (-1.0 + max(
				max(-p.x - p.y - p.z, p.x + p.y - p.z), 
				max(-p.x + p.y + p.z, p.x - p.y + p.z)))/sqrt(3.0);
	`);

}

export function unitCylinder(): Shape {
	return shape(`return length(p.xy) - 1.0;`);
}

export function plane(normal: Expression, offset: Expression) {
	return shape(`return dot(p, ${normal}) + ${offset}.x;`);
}

export function translate(x: Expression, a: Shape) {
	return shape(`return ${a.call(`p - ${x}`)};`,
		[a]);
}

export function scale(x: Expression, a: Shape) {
	return shape(`return ${a.call(`p / ${x}.x`)} * ${x}.x;`,
		[a]);
}

export function repeat(x: Expression, a: Shape) {
	return shape(`return ${a.call(`mod(p, ${x}) - ${x} * 0.5`)};`,
		[a]);
}

export function union(a: Shape, b: Shape) {
	return shape(`return min(${a.call("p")}, ${b.call("p")});`,
		[a, b]);
}

export function intersection(a: Shape, b: Shape) {
	return shape(`return max(${a.call("p")}, ${b.call("p")});`,
		[a, b]);
}

export function difference(a: Shape, b: Shape) {
	return shape(`return max(${a.call("p")}, -${b.call("p")});`,
		[a, b]);
}

export function blend(k: number, a: Shape, b: Shape) {
	return shape(`
		float a = ${a.call("p")};
		float b = ${b.call("p")};
		const float k = ${value(k)}.x;
		float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
		return mix(b, a, h) - k * h * (1.0 - h);`,
		[a, b]);
}

export function wrapX(a: Shape) {
	return shape(`
		float q = length(p.yz);
		return ${a.call("vec3(p.x, q, asin(p.z / q))")};`,
		[a]);
}

export function rotateY(r: Expression, a: Shape) {
	return shape(`
	return ${a.call(`vec3(
		cos(${r}.x) * p.x + sin(${r}.x) * p.z,
		p.y,
		-sin(${r}.x) * p.x + cos(${r}.x) * p.z)`)};`,
		[a]);
}

export function sierpinski(iterations: number = 5, a: Shape = unitTetrahedon()) {
	return shape(`
		const vec3 n1 = normalize(vec3(1, 1, 0));
		const vec3 n2 = normalize(vec3(0, 1, 1));
		const vec3 n3 = normalize(vec3(1, 0, 1));
		for(int n = 0; n < ${iterations}; n++) {
			p -= 2.0 * min(0.0, dot(p, n1)) * n1;
			p -= 2.0 * min(0.0, dot(p, n2)) * n2;
			p -= 2.0 * min(0.0, dot(p, n3)) * n3;
			p = p * 2.0 - 1.0;
		}
		return ${(a.call("p"))} * pow(2.0, -float(${iterations}));
    `, [a]);
}