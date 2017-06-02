import {Code, Expression, value} from "./expression";

export type Shape = {
	readonly id: number,
	readonly body: Code,
	readonly dependencies: Shape[],
	readonly call: (_: Expression) => Expression,
}

let lastId = 1;
function createShape(
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
	return createShape(`return length(p) - 1.0;`);
}

export function unitBox(): Shape {
	return createShape(`
		vec3 d = abs(p) - vec3(1, 1, 1);
		return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));`);
}

export function unitCylinder(): Shape {
	return createShape(`return length(p.xy) - 1.0;`);
}

export function plane(normal: Expression, offset: Expression) {
	return createShape(`return dot(p, ${normal}) + ${offset}.x;`);
}

export function translate(x: Expression, shape: Shape) {
	return createShape(`return ${shape.call(`p - ${x}`)};`, [shape]);
}

export function scale(x: Expression, shape: Shape) {
	return createShape(`return ${shape.call(`p / ${x}.x`)} * ${x}.x;`, [shape]);
}

export function repeat(x: Expression, shape: Shape) {
	return createShape(`return ${shape.call(`mod(p, ${x}) - ${x} * 0.5`)};`, [shape]);
}

export function union(a: Shape, b: Shape) {
	return createShape(`return min(${a.call("p")}, ${b.call("p")});`, [a, b]);
}

export function intersection(a: Shape, b: Shape) {
	return createShape(`return max(${a.call("p")}, ${b.call("p")});`, [a, b]);
}

export function difference(a: Shape, b: Shape) {
	return createShape(`return max(${a.call("p")}, -${b.call("p")});`, [a, b]);
}

export function blend(k: number, a: Shape, b: Shape) {
	return createShape(`
		float a = ${a.call("p")};
		float b = ${b.call("p")};
		const float k = ${value(k)}.x;
		float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
		return mix(b, a, h) - k * h * (1.0 - h);
	`, [a, b]);
}

/*

 export class WrapX extends DistanceFunction {
 constructor(private x: DistanceFunction) {
 super();
 }

 value(position: Expression) {
 const q = new Length(
 new FixVectorValue(
 new Value(0),
 new Y(position),
 new Z(position)));
 return this.x.value(
 new FixVectorValue(
 new X(position),
 q,
 new Acos(
 new Divide(
 new Y(position),
 q))));
 }
 }

 export class WrapZ extends DistanceFunction {
 constructor(private x: DistanceFunction) {
 super();
 }

 value(position: Expression) {
 const q = new Length(
 new FixVectorValue(
 new X(position),
 new Y(position),
 new Value(0)));
 return this.x.value(
 new FixVectorValue(
 q,
 new Acos(
 new Divide(
 new X(position),
 q)),
 new Z(position)));
 }
 }

 export class RotateX extends DistanceFunction {
 constructor(private x: DistanceFunction,
 private v: Expression) {
 super();
 }

 value(position: Expression) {
 return this.x.value(
 new FixVectorValue(
 new X(position),
 new Add(new Multiply(new Cos(this.v), new Y(position)), new Multiply(new Sin(this.v), new Z(position))),
 new Add(new Multiply(new Negative(new Sin(this.v)), new Y(position)), new Multiply(new Cos(this.v), new Z(position)))));
 }
 }

 export class RotateY extends DistanceFunction {
 constructor(private x: DistanceFunction,
 private v: Expression) {
 super();
 }

 value(position: Expression) {
 return this.x.value(
 new FixVectorValue(
 new Add(new Multiply(new Cos(this.v), new X(position)), new Multiply(new Sin(this.v), new Z(position))),
 new Y(position),
 new Add(new Multiply(new Negative(new Sin(this.v)), new X(position)), new Multiply(new Cos(this.v), new Z(position)))));
 }
 }

 export class RotateZ extends DistanceFunction {
 constructor(private x: DistanceFunction,
 private v: Expression) {
 super();
 }

 value(position: Expression) {
 return this.x.value(
 new FixVectorValue(
 new Add(new Multiply(new Cos(this.v), new X(position)), new Multiply(new Sin(this.v), new Y(position))),
 new Add(new Multiply(new Negative(new Sin(this.v)), new X(position)), new Multiply(new Cos(this.v), new Y(position))),
 new Z(position)))
 }
 }

 export class Test extends DistanceFunction {
 value(position: Expression) {
 return new Multiply(
 new Add(
 new Multiply(
 new Multiply(
 new Cos(
 new X(
 new Multiply(
 position,
 new Value(6.0)))),
 new Cos(
 new Y(
 new Multiply(
 position,
 new Value(4.0))))),
 new Cos(
 new Z(
 new Multiply(
 position,
 new Value(5.0))))),
 new Value(1.0)),
 new Value(0.02));
 }
 }

 export class TwistZ extends DistanceFunction {
 constructor(private x: DistanceFunction) {
 super();
 }

 value(position: Expression) {
 const angle = new Z(
 new Multiply(position,
 new Value(3.14159 * 0.25)));
 return this.x.value(
 new FixVectorValue(
 new Add(
 new Multiply(
 new Cos(angle),
 new X(position)),
 new Multiply(
 new Negative(
 new Sin(angle)),
 new Y(position))),
 new Add(
 new Multiply(
 new Sin(angle),
 new X(position)),
 new Multiply(
 new Cos(angle),
 new Y(position))),
 new Z(position)));
 }
 }

 export class Displace extends DistanceFunction {
 constructor(private x: DistanceFunction,
 private y: DistanceFunction) {
 super();
 }

 value(position: Expression) {
 return new Add(
 this.x.value(position),
 this.y.value(position));
 }
 } */