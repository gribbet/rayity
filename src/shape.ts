import { Expression, expression, value } from './expression';

export type Shape = {
	readonly call: (position: Expression) => Expression,
}

function shape(call: (position: Expression) => Expression): Shape {
	return {
		call: (position: Expression) => {
			let x = call(position);
			return expression(
				x.body,
				[position].concat(x.dependencies));
		}
	};
}

export function zero(): Shape {
	return shape(p =>
		expression(`MAX_VALUE`));
}

export function unit(): Shape {
	return shape(p =>
		expression(`-MAX_VALUE`));
}

export function sphere(): Shape {
	return shape(p =>
		expression(`length(${p}) - 0.5`));
}

export function plane(normal: Expression, offset: Expression): Shape {
	return shape(p =>
		expression(`dot(${p}, ${normal}) + ${offset}.x`, [normal, offset]));
}

function unitShape(normals: Expression[]): Shape {
	return normals.reduce((s, n) =>
		intersection(s,
			plane(n, value(-0.5))),
		unit());
}

export function tetrahedron(): Shape {
	let l = Math.sqrt(3);
	return unitShape([
		value(-1 / l, -1 / l, -1 / l),
		value(-1 / l, 1 / l, 1 / l),
		value(1 / l, -1 / l, 1 / l),
		value(1 / l, 1 / l, -1 / l),
	]);
}

export function cube(): Shape {
	return unitShape([
		value(1, 0, 0),
		value(-1, 0, 0),
		value(0, 1, 0),
		value(0, -1, 0),
		value(0, 0, 1),
		value(0, 0, -1)
	]);
}

export function Octohedron(): Shape {
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

export function dodecahedron(): Shape {
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
	return shape(p =>
		expression(`length(${p}.xz) - 0.5`));
}

export function torus(): Shape {
	return shape(p =>
		expression(`length(vec2(length(${p}.xz) - 0.5, ${p}.y, 0.0)) - 0.1`));
}

export function translate(x: Expression, a: Shape): Shape {
	return shape(p =>
		a.call(expression(`${p} - ${x}`, [x])));
}

export function scale(x: Expression, a: Shape): Shape {
	return shape(p => {
		let q = a.call(expression(`${p} / ${x}.x`, [x]));
		return expression(`${q} * ${x}.x`, [q, x]);
	});
}

export function max(a: Shape): Shape {
	return shape(p =>
		a.call(expression(`max(${p}, 0.0)`, [p])));
}

export function stretch(x: Expression, a: Shape): Shape {
	return shape(p =>
		a.call(expression(`${p} / ${x}`, [x])));
}

export function repeat(x: Expression, a: Shape): Shape {
	return shape(p =>
		a.call(expression(`mod(${p} - ${x} * 0.5, ${x}) - ${x} * 0.5`, [x])));
}

export function union(a: Shape, b: Shape): Shape {
	return shape(p => {
		let da = a.call(p);
		let db = b.call(p);
		return expression(`min(${da}, ${db})`, [da, db])
	});
}

export function intersection(a: Shape, b: Shape): Shape {
	return shape(p => {
		let da = a.call(p);
		let db = b.call(p);
		return expression(`max(${da}, ${db})`, [da, db])
	});
}

export function difference(a: Shape, b: Shape): Shape {
	return shape(p => {
		let da = a.call(p);
		let db = b.call(p);
		return expression(`max(${da}, -${db})`, [da, db])
	});
}

export function blend(k: Expression, a: Shape, b: Shape): Shape {
	return shape(p => {
		let da = a.call(p);
		let db = b.call(p);
		let h = expression(`clamp(0.5 + 0.5 * (${db} - ${da}) / ${k}, 0.0, 1.0)`, [da, db, k]);
		return expression(`mix(${db}, ${da}, ${h}) - ${k} * ${h} * (1.0 - ${h})`, [da, db, k, h]);
	});
}

export function expand(k: Expression, a: Shape): Shape {
	return shape(p => {
		let da = a.call(p);
		return expression(`${da} - ${k}.x`, [da, k])
	});
}

export function twistX(x: Expression, a: Shape): Shape {
	return shape(p =>
		rotateX(expression(`vec3(${p}.x * ${x}.x)`, [x]), a).call(p));
}

export function twistY(x: Expression, a: Shape): Shape {
	return shape(p =>
		rotateY(expression(`vec3(${p}.y * ${x}.x)`, [x]), a).call(p));
}

export function twistZ(x: Expression, a: Shape): Shape {
	return shape(p =>
		rotateZ(expression(`vec3(${p}.z * ${x}.x)`, [x]), a).call(p));
}

export function rotateX(x: Expression, a: Shape): Shape {
	return shape(p => {
		let c = expression(`cos(${x}.x), sin(${x}.x), 0`, [x]);
		return a.call(expression(`mat3(1, 0, 0, 0, ${c}.x, ${c}.y, 0, -${c}.y, ${c}.x) * ${p}`, [c]))
	});
}

export function rotateY(x: Expression, a: Shape): Shape {
	return shape(p => {
		let c = expression(`cos(${x}.x), sin(${x}.x), 0`, [x]);
		return a.call(expression(`mat3(${c}.x, 0, -${c}.y, 0, 1, 0, ${c}.y, 0, ${c}.x) * ${p}`, [c]))
	});
}

export function rotateZ(x: Expression, a: Shape): Shape {
	return shape(p => {
		let c = expression(`cos(${x}.x), sin(${x}.x), 0`, [x]);
		return a.call(expression(`mat3(${c}.x, ${c}.y, 0, -${c}.y, ${c}.x, 0, 0, 0, 1) * ${p}`, [c]))
	});
}

export function rotate(axis: Expression, x: Expression, a: Shape): Shape {
	return shape(p => {
		let u = expression(`normalize(axis)`, [axis]);
		let c = expression(`cos(${x}.x), sin(${x}.x), 0`, [x]);
		return a.call(expression(`mat3(
			${c}.x + ${u}.x * ${u}.x * (1.0 - ${c}.x), 
			${u}.x * ${u}.y * (1.0 - ${c}.x) - ${u}.z * ${c}.y,
			${u}.x * ${u}.z * (1.0 - ${c}.x) + ${u}.y * ${c}.y,
			${u}.y * ${u}.x * (1.0 - ${c}.x) + ${u}.z * ${c}.y,
			${c}.x + ${u}.y * ${u}.y * (1.0 - ${c}.x),
			${u}.x * ${u}.y * (1.0 - ${c}.x) - ${u}.x * ${c}.y,
			${u}.z * ${u}.x * (1.0 - ${c}.x) - ${u}.y * ${c}.y,
			${u}.z * ${u}.y * (1.0 - ${c}.x) + ${u}.x * ${c}.y,
			${c}.x +  ${u}.z * ${u}.z * (1.0 - ${c}.x)) * ${p}`, [u, c]));
	});
}

export function wrapX(a: Shape): Shape {
	return shape(p => {
		let c = expression(`length(p.yz)`);
		return a.call(expression(`${p}.x, ${c}.x, asin(${p}.z / ${c}.x)`, [c]));
	});
}

export function mirror(n: Expression, a: Shape): Shape {
	return shape(p =>
		a.call(expression(`${p} - 2.0 * min(0.0, dot(${p}, ${n})) * ${n}`, [n])));
}

export function smoothBox(dimensions: Expression, radius: Expression): Shape {
	return mirror(value(1, 0, 0),
		mirror(value(0, 1, 0),
			mirror(value(0, 0, 1),
				translate(expression(`0.5 * (${dimensions} - ${radius})`, [dimensions, radius]),
					max(
						scale(radius,
							sphere()))))));
}

export function sierpinski(iterations: number = 5, a: Shape = tetrahedron()): Shape {
	let l = Math.sqrt(2);
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

export function tree(iterations: number = 8): Shape {
	let factor = 0.58;
	let length = 1.2;
	let width = 0.1;
	let angle = 50;

	return Array(iterations)
		.fill(0)
		.reduce((shape, _, i) =>
			blend(
				value(0.15 * Math.pow(factor, i)),
				shape,
				mirror(value(1 / Math.sqrt(2), 0, 1 / Math.sqrt(2)),
					mirror(value(1 / Math.sqrt(2), 0, -1 / Math.sqrt(2)),
						translate(
							value(
								length * factor / 2 * Math.sin(angle / 180 * Math.PI),
								length / 2 * (1 + factor / 2 * Math.cos(angle / 180 * Math.PI)),
								0),
							scale(value(factor),
							rotateY(value(0.1),
								rotateZ(value(angle / 180 * Math.PI),
									shape))))))),
		smoothBox(value(width, length, width), value(width / 2)));
}