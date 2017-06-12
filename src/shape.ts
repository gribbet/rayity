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

export function twistZ(x: Expression, a: Shape) {
	return shape(`
		float c = cos(${x}.x * p.z);
		float s = sin(${x}.x * p.z);
		mat2  m = mat2(c, -s, s, c);
		return ${a.call(`vec3(m * p.xy, p.z)`)};`,
		[a]);
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
		for(int i = 1; i <= ${iterations}; i++) {
			p -= 2.0 * min(0.0, dot(p, n1)) * n1;
			p -= 2.0 * min(0.0, dot(p, n2)) * n2;
			p -= 2.0 * min(0.0, dot(p, n3)) * n3;
			p = p * 2.0 - 1.0;
		} 
		return ${(a.call("p"))} * pow(2.0, -float(i));
    `, [a]);
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