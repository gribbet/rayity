import {Color} from "./Color";
import {Vector} from "./Vector";

let id = 1;

export abstract class Expression {
	readonly id: string = `a${id++}`;
	readonly value: string;

	constructor(readonly dependencies: Expression[] = []) {
	}

	toString(): string {
		return this.id;
	}
}


export class Variable extends Expression {
	readonly value = this.name;

	constructor(private name: string) {
		super();
	}
}

export class Value extends Expression {
	readonly value = `vec4(${this.number.toPrecision(6)})`;

	constructor(private number: number) {
		super();
	}
}

export class ColorValue extends Expression {
	readonly value = `vec4(${this.color.red}, ${this.color.green}, ${this.color.blue}, 0)`;

	constructor(private color: Color) {
		super();
	}
}

export class VectorValue extends Expression {
	readonly value = `vec4(${this.v.x}, ${this.v.y}, ${this.v.z}, 0)`;

	constructor(private v: Vector) {
		super();
	}
}

export class FixVectorValue extends Expression {
	readonly value = `vec4(${this.x}.x, ${this.y}.x, ${this.z}.x, 0)`;

	constructor(private x: Expression,
				private y: Expression,
				private z: Expression) {
		super([x, y, z]);
	}
}

export class Length extends Expression {
	readonly value = `vec4(length(${this.x}))`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Subtract extends Expression {
	readonly value = `${this.a} - ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Add extends Expression {
	readonly value = `${this.a} + ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Multiply extends Expression {
	readonly value = `${this.a} * ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Divide extends Expression {
	readonly value = `${this.a} / ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Dot extends Expression {
	readonly value = `vec4(dot(${this.a}, ${this.b}))`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Mod extends Expression {
	readonly value = `mod(${this.a}, ${this.b})`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Abs extends Expression {
	readonly value = `abs(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Min extends Expression {
	readonly value = `min(${this.a}, ${this.b})`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Max extends Expression {
	readonly value = `max(${this.a}, ${this.b})`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

export class Negative extends Expression {
	readonly value = `-${this.x}`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class X extends Expression {
	readonly value = `vec4(${this.x}.x)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Y extends Expression {
	readonly value = `vec4(${this.x}.y)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Z extends Expression {
	readonly value = `vec4(${this.x}.z)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Exp extends Expression {
	readonly value = `exp(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Log extends Expression {
	readonly value = `log(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Acos extends Expression {
	readonly value = `acos(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}


export class Clamp extends Expression {
	readonly value = `clamp(${this.x}, 0.0, 1.0)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Mix extends Expression {
	readonly value = `mix(${this.a}, ${this.b}, ${this.k})`;

	constructor(private a: Expression,
				private b: Expression,
				private k: Expression) {
		super([a, b, k]);
	}
}

export class Cos extends Expression {
	readonly value = `cos(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

export class Sin extends Expression {
	readonly value = `sin(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

abstract class Chain extends Expression {
	readonly id = this.x.id;
	readonly value = this.x.value;
	readonly dependencies = this.x.dependencies;

	constructor(private x: Expression) {
		super([]);
	}
}

export class SmoothMin extends Chain {
	constructor(a: Expression, b: Expression, k: number = 1) {
		let h = new Clamp(
			new Add(
				new Value(0.5),
				new Divide(
					new Multiply(
						new Value(0.5),
						new Subtract(a, b)),
					new Value(k),
				)));
		super(new Subtract(
			new Mix(a, b, h),
			new Multiply(
				new Multiply(
					new Value(k),
					h),
				new Subtract(
					new Value(1),
					h))));
	}
}