import {
	Abs,
	Add,
	Cos,
	Divide,
	Dot,
	Expression,
	Length,
	Max,
	Min,
	Multiply,
	Negative,
	SmoothMin,
	Subtract,
	Value,
	VectorValue,
	X,
	Y,
	Z
} from "./Expression";

import {Vector} from "./Vector";


export abstract class DistanceFunction {
	abstract value(position: Expression): Expression;
}

export class UnitSphere extends DistanceFunction {
	value(position: Expression) {
		return new Subtract(
			new Length(position),
			new Value(1.0));
	}
}

export class UnitBox extends DistanceFunction {
	value(position: Expression) {
		let d = new Subtract(
			new Abs(position),
			new VectorValue(new Vector(1, 1, 1)));
		return new Add(
			new Min(new Max(new X(d), new Max(new Y(d), new Z(d))), new Value(0)),
			new Length(new Max(d, new Value(0))));
	}
}

export class Plane extends DistanceFunction {
	constructor(private normal: Expression,
				private offset: Expression) {
		super();
	}

	value(position: Expression) {
		return new Add(new Dot(position, this.normal), this.offset);
	}
}

export class UnitCylinder extends DistanceFunction {
	constructor() {
		super();
	}

	value(position: Expression) {
		return new Subtract(
			new Length(
				new Multiply(
					position,
					new VectorValue(new Vector(1, 1, 0)))),
			new Value(1.0));
	}
}

export class Scale extends DistanceFunction {
	constructor(private f: DistanceFunction,
				private x: Expression) {
		super();
	}

	value(position: Expression) {
		return new Multiply(
			this.f.value(
				new Divide(position, this.x)),
			this.x);
	}
}

export class Union extends DistanceFunction {
	constructor(private a: DistanceFunction,
				private b: DistanceFunction) {
		super();
	}

	value(position: Expression) {
		return new Min(
			this.a.value(position),
			this.b.value(position));
	}
}

export class Subtraction extends DistanceFunction {
	constructor(private a: DistanceFunction,
				private b: DistanceFunction) {
		super();
	}

	value(position: Expression) {
		return new Max(
			this.a.value(position),
			new Negative(this.b.value(position)));
	}
}

export class Blend extends DistanceFunction {
	constructor(private a: DistanceFunction,
				private b: DistanceFunction,
				private k: number = 1.0) {
		super();
	}

	value(position: Expression) {
		return new SmoothMin(
			this.a.value(position),
			this.b.value(position),
			this.k);
	}
}

export class Translate extends DistanceFunction {
	constructor(private x: DistanceFunction,
				private v: Vector) {
		super();
	}

	value(position: Expression) {
		return this.x.value(
			new Subtract(
				position,
				new VectorValue(this.v)));
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
}