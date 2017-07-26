import { Code, Expression, value } from './expression';

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
	return shape(`return length(p) - 0.5;`);
}

function unit() {
	return shape(`return -MAX_VALUE;`);
}

function unitShape(normals: Expression[]) {
	return normals.reduce((s, n) =>
		intersection(s,
			plane(n, value(-0.5))),
		unit());
}

export function unitTetrahedron() {
	let l = Math.sqrt(3);
	return unitShape([
		value(-1 / l, -1 / l, -1 / l),
		value(-1 / l, 1 / l, 1 / l),
		value(1 / l, -1 / l, 1 / l),
		value(1 / l, 1 / l, -1 / l),
	]);
}

export function unitCube() {
	return unitShape([
		value(1, 0, 0),
		value(-1, 0, 0),
		value(0, 1, 0),
		value(0, -1, 0),
		value(0, 0, 1),
		value(0, 0, -1)
	]);
}

export function unitOctohedron() {
	let l = Math.sqrt(3);
	return unitShape([
		value(1 / l, 1 / l, 1 / l),
		value(1 / l, 1 / l, -1 / l),
		value(1 / l, -1 / l, 1 / l),
		value(1 / l, -1 / l, -1 / l),
		value(-1 / l, 1 / l, 1 / l),
		value(-1 / l, 1 / l, -1 / l),
		value(-1 / l, -1 / l, 1 / l),
		value(-1 / l, -1 / l, -1 / l),
	]);
}

export function unitDodecahedron() {
	let phi = 0.5 * (1 + Math.sqrt(5));
	let l = Math.sqrt(phi * phi + 1);
	return unitShape([
		value(phi / l, 1 / l, 0),
		value(phi / l, -1 / l, 0),
		value(0, phi / l, 1 / l),
		value(0, phi / l, -1 / l),
		value(1 / l, 0, phi / l),
		value(-1 / l, 0, phi / l),
		value(-phi / l, 1 / l, 0),
		value(-phi / l, -1 / l, 0),
		value(0, -phi / l, 1 / l),
		value(0, -phi / l, -1 / l),
		value(1 / l, 0, -phi / l),
		value(-1 / l, 0, -phi / l)
	]);
}

export function cylinder(): Shape {
	return shape(`return length(p.xz) - 0.5;`);
}

export function torus(): Shape {
	return shape(`
		vec2 q = vec2(length(p.xz) - 0.5, p.y);
  		return length(q) - 0.1;`);
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

export function stretch(x: Expression, a: Shape) {
	return shape(`return ${a.call(`p / ${x}`)}; `,
		[a]);
}

export function repeat(x: Expression, a: Shape) {
	return shape(`return ${a.call(`mod(p - ${x} * 0.5, ${x}) - ${x} * 0.5`)};`,
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

export function blend(k: Expression, a: Shape, b: Shape) {
	return shape(`
		float a = ${a.call("p")};
		float b = ${b.call("p")};
		float k = ${k}.x;
		float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
		return mix(b, a, h) - k * h * (1.0 - h);`,
		[a, b]);
}

export function expand(k: Expression, a: Shape) {
	return shape(`
		return ${a.call(`p`)} - ${k}.x;`,
		[a]);
}

export function twistX(x: Expression, a: Shape) {
	return rotateZ(`vec3(p.x * ${x}.x)`, a);
}

export function twistY(x: Expression, a: Shape) {
	return rotateZ(`vec3(p.y * ${x}.x)`, a);
}

export function twistZ(x: Expression, a: Shape) {
	return rotateZ(`vec3(p.z * ${x}.x)`, a);
}

export function wrapX(a: Shape) {
	return shape(`
		float q = length(p.yz);
		return ${a.call(`vec3(p.x, q, asin(p.z / q))`)};`,
		[a]);
}

export function rotateX(x: Expression, a: Shape) {
	return shape(`
		float c = cos(${x}.x);
		float s = sin(${x}.x);
		mat3 m = mat3(1, 0, 0, 0, c, s, 0, -s, c);
		return ${a.call(`m * p`)};`,
		[a]);
}

export function rotateY(x: Expression, a: Shape) {
	return shape(`
		float c = cos(${x}.x);
		float s = sin(${x}.x);
		mat3 m = mat3(c, 0, -s, 0, 1, 0, s, 0, c);
		return ${a.call(`m * p`)};`,
		[a]);
}

export function rotateZ(x: Expression, a: Shape) {
	return shape(`
		float c = cos(${x}.x);
		float s = sin(${x}.x);
		mat3 m = mat3(c, s, 0, -s, c, 0, 0, 0, 1);
		return ${a.call(`m * p`)};`,
		[a]);
}

export function rotate(axis: Expression, x: Expression, a: Shape) {
	return shape(`
		vec3 u = normalize(${axis});
		float c = cos(${x}.x);
		float s = sin(${x}.x);
		mat3 m = mat3(
			c + u.x * u.x * (1.0 - c), 
			u.x * u.y * (1.0 - c) - u.z * s,
			u.x * u.z * (1.0 - c) + u.y * s,
			u.y * u.x * (1.0 - c) + u.z * s,
			c + u.y * u.y * (1.0 - c),
			u.x * u.y * (1.0 - c) - u.x * s,
			u.z * u.x * (1.0 - c) - u.y * s,
			u.z * u.y * (1.0 - c) + u.x * s,
			c +  u.z * u.z * (1.0 - c));
		return ${a.call(`m * p`)};`,
		[a]);
}

export function mirror(n: Expression, a: Shape) {
	return shape(`
		p -= 2.0 * min(0.0, dot(p, ${n})) * ${n};
		return ${a.call(`p`)};`,
		[a]);
}

export function sierpinski(iterations: number = 5, a: Shape = unitTetrahedron()) {
	let l = Math.sqrt(2);
	let shape = a;
	return Array(iterations)
		.fill(0)
		.reduce((shape, i) =>
			mirror(value(1 / l, 1 / l, 0),
				mirror(value(0, 1 / l, 1 / l),
					mirror(value(1 / l, 0, 1 / l),
						scale(value(0.5),
							translate(value(0.5 * Math.sqrt(3)),
								shape))))), a);
}

export function mandelbulb(iterations: number = 5) {
	return shape(`
		vec3 z = p;
		float d = 0.0;
		float q = 8.0;
		float s = 1.0;
		
		for(int i = 1; i <= ${iterations}; i++) {
		
			float r = length(z);
	
			if(r > 2.0) {
				d = 0.5 * log(r) * r / s;
				continue;
			}
			
			float th = atan(length(z.xy), z.z);
			float phi = atan(z.y, z.x);
			float rado = pow(r, 8.0);
			s = pow(r, 7.0) * 7.0 * s + 1.0;
			
			float sint = sin(th * q);
			z.x = rado * sint * cos(phi * q);
			z.y = rado * sint * sin(phi * q);
			z.z = rado * cos(th * q) ;
			z += p;
		}
		
		return d;`);
}