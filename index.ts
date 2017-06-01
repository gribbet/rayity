declare function require(name: string): string;

let id = 1;

abstract class Expression {
	readonly id: string = `a${id++}`;
	readonly value: string;

	constructor(readonly dependencies: Expression[] = []) {
	}

	toString(): string {
		return this.id;
	}
}

class Variable extends Expression {
	readonly value = this.name;

	constructor(private name: string) {
		super();
	}
}

class Value extends Expression {
	readonly value = `vec4(${this.number.toPrecision(6)})`;

	constructor(private number: number) {
		super();
	}
}

class ColorValue extends Expression {
	readonly value = `vec4(${this.color.red}, ${this.color.green}, ${this.color.blue}, 0)`;

	constructor(private color: Color) {
		super();
	}
}

class VectorValue extends Expression {
	readonly value = `vec4(${this.v.x}, ${this.v.y}, ${this.v.z}, 0)`;

	constructor(private v: Vector) {
		super();
	}
}

class Length extends Expression {
	readonly value = `vec4(length(${this.x}))`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Subtract extends Expression {
	readonly value = `${this.a} - ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Add extends Expression {
	readonly value = `${this.a} + ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Multiply extends Expression {
	readonly value = `${this.a} * ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Divide extends Expression {
	readonly value = `${this.a} / ${this.b}`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Dot extends Expression {
	readonly value = `vec4(dot(${this.a}, ${this.b}))`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Abs extends Expression {
	readonly value = `abs(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Min extends Expression {
	readonly value = `min(${this.a}, ${this.b})`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Max extends Expression {
	readonly value = `max(${this.a}, ${this.b})`;

	constructor(private a: Expression,
				private b: Expression) {
		super([a, b]);
	}
}

class Negative extends Expression {
	readonly value = `-${this.x}`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class X extends Expression {
	readonly value = `vec4(${this.x}.x)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Y extends Expression {
	readonly value = `vec4(${this.x}.y)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Z extends Expression {
	readonly value = `vec4(${this.x}.z)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Exp extends Expression {
	readonly value = `exp(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Log extends Expression {
	readonly value = `log(${this.x})`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Clamp extends Expression {
	readonly value = `clamp(${this.x}, 0.0, 1.0)`;

	constructor(private x: Expression) {
		super([x]);
	}
}

class Mix extends Expression {
	readonly value = `mix(${this.a}, ${this.b}, ${this.k})`;

	constructor(private a: Expression,
				private b: Expression,
				private k: Expression) {
		super([a, b, k]);
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

class SmoothMin extends Chain {
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

abstract class DistanceFunction {
	abstract value(position: Expression): Expression;
}

class UnitSphere extends DistanceFunction {
	value(position: Expression) {
		return new Subtract(
			new Length(position),
			new Value(1.0));
	}
}

class UnitBox extends DistanceFunction {
	value(position: Expression) {
		let d = new Subtract(
			new Abs(position),
			new VectorValue(new Vector(1, 1, 1)));
		return new Add(
			new Min(new Max(new X(d), new Max(new Y(d), new Z(d))), new Value(0)),
			new Length(new Max(d, new Value(0))));
	}
}

class Plane extends DistanceFunction {
	constructor(private normal: Expression,
				private offset: Expression) {
		super();
	}

	value(position: Expression) {
		return new Add(new Dot(position, this.normal), this.offset);
	}
}

class Scale extends DistanceFunction {
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

class Union extends DistanceFunction {
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

class Subtraction extends DistanceFunction {
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

class Blend extends DistanceFunction {
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

class Translate extends DistanceFunction {
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

class Vector {
	constructor(public x: number,
				public y: number,
				public z: number) {
	}
}

class Color {
	constructor(public red: number,
				public green: number,
				public blue: number) {
	}
}

class Material {
	constructor(public transmittance: number = 0.0,
				public smoothness: number = 0.0,
				public refraction: number = 1.0,
				public color: Color = new Color(1, 1, 1),
				public emissivity: Color = new Color(0, 0, 0)) {
	}

	withTransmittance(transmittance: number): Material {
		this.transmittance = transmittance;
		return this;
	}

	withSmoothness(smoothness: number): Material {
		this.smoothness = smoothness;
		return this;
	}

	withRefraction(refraction: number): Material {
		this.refraction = refraction;
		return this;
	}

	withColor(color: Color): Material {
		let copy = Object.create(this);
		copy.color = color;
		return copy;
	}

	withEmissivity(emissivity: Color): Material {
		let copy = Object.create(this);
		copy.emissivity = emissivity;
		return copy;
	}
}

class Shape {
	readonly id: string = `${id++}`;

	constructor(public f: DistanceFunction,
				public material: Material = new Material()) {
	}
}

class Scene {
	constructor(public shapes: Shape[]) {
	}
}

function dependencies(x: Expression): Expression[] {
	let all = x.dependencies
		.map(y => dependencies(y))
		.reduce((a, b) => a.concat(b), [])
		.concat(x);
	return all
		.filter((x, i) => all.indexOf(x) == i);
}

function renderExpression(x: Expression): string {
	return dependencies(x)
		.map(x => `vec4 ${x.id} = ${x.value};`)
		.reduce((a, b) => a + b, "");
}

function renderShape(shape: Shape): string {
	let x = shape.f.value(new Variable("a"));
	let transmittance = new Value(shape.material.transmittance);
	let smoothness = new Value(shape.material.smoothness);
	let refraction = new Value(shape.material.refraction);
	let color = new ColorValue(shape.material.color);
	let emissivity = new ColorValue(shape.material.emissivity);

	return `
		float distance${shape.id}(vec3 position) {
			vec4 a = vec4(position, 0);
			${renderExpression(x)}
			return ${x.id}.x;
		}
		
		vec3 normal${shape.id}(vec3 position) {
			return normalize(vec3(
				distance${shape.id}(position + vec3(epsilon, 0, 0)) -
				distance${shape.id}(position - vec3(epsilon, 0, 0)),
				distance${shape.id}(position + vec3(0, epsilon, 0)) -
				distance${shape.id}(position - vec3(0, epsilon, 0)),
				distance${shape.id}(position + vec3(0, 0, epsilon)) -
				distance${shape.id}(position - vec3(0, 0, epsilon))));
		}
		
		Material material${shape.id}() {
			${renderExpression(transmittance)}
			${renderExpression(smoothness)}
			${renderExpression(refraction)}
			${renderExpression(color)}
			${renderExpression(emissivity)}
			Material m;
			m.transmittance = ${transmittance}.x;
			m.smoothness = ${smoothness}.x;
			m.refraction = ${refraction}.x;
			m.color = ${color}.xyz;
			m.emissivity = ${emissivity}.xyz;
			return m;
		}`
}

function renderScene(scene: Scene): string {
	return scene.shapes
			.map(_ => renderShape(_))
			.reduce((a, b) => a + b, "") + `
		
		Closest calculateClosest(vec3 position) {
			Closest closest;
			float distance;
		
			closest.object = 0;
			closest.distance = MAX_VALUE;` +

		scene.shapes
			.map((shape, i) => `
			
			distance = abs(distance${shape.id}(position));
			if (distance < closest.distance) {
				closest.distance = distance;
				closest.object = ${shape.id};
			}`)
			.reduce((a, b) => a + b, "") + `
			
			return closest;
		}
		
		vec3 calculateNormal(int object, vec3 position) {` +

		scene.shapes
			.map((shape, i) => `
			
			if (object == ${shape.id})
				return normal${shape.id}(position);`)
			.reduce((a, b) => a + b, "") + `
			
			return vec3(0, 0, 0);
		}
		
		Material calculateMaterial(int object) {` +

		scene.shapes
			.map((shape, i) => `
			
			if (object == ${shape.id})
				return material${shape.id}();`)
			.reduce((a, b) => a + b, "") + `
			
			Material material;
			return material;
		}`
}

let wallMaterial = new Material()
	.withColor(new Color(0.9, 0.9, 0.9));
let scene = new Scene([
	new Shape(
		new Plane(new VectorValue(new Vector(1, 0, 0)), new Value(20.0)),
		wallMaterial),
	new Shape(
		new Plane(new VectorValue(new Vector(0, 1, 0)), new Value(20.0)),
		wallMaterial
			.withColor(new Color(0.9, 0.7, 0.7))),
	new Shape(
		new Plane(new VectorValue(new Vector(0, -1, 0)), new Value(20.0)),
		wallMaterial
			.withColor(new Color(0.7, 0.9, 0.7))),
	new Shape(
		new Plane(new VectorValue(new Vector(0, 0, 1)), new Value(20.0)),
		wallMaterial),
	new Shape(
		new Plane(new VectorValue(new Vector(0, 0, -1)), new Value(20.0)),
		wallMaterial),
	new Shape(
		new Subtraction(
			new Subtraction(
				new Subtraction(
					new Subtraction(
						new Plane(new VectorValue(new Vector(0, 0, -1)), new Value(19.9999)),
						new Plane(new VectorValue(new Vector(0, 1, 0)), new Value(5.0))),
					new Plane(new VectorValue(new Vector(0, -1, 0)), new Value(5.0))),
				new Plane(new VectorValue(new Vector(1, 0, 0)), new Value(5.0))),
			new Plane(new VectorValue(new Vector(-1, 0, 0)), new Value(5.0))),
		new Material()
			.withColor(new Color(0, 0, 0))
			.withEmissivity(new Color(30, 30, 30))),
	new Shape(
		new Translate(
			new Scale(
				new UnitSphere(),
				new Value(6)),
			new Vector(-2, -10, -10)),
		new Material()
			.withTransmittance(0.9)
			.withSmoothness(0.8)
			.withRefraction(1.4)
			.withColor(new Color(0.8, 0.8, 1.0))),
	new Shape(
		new Translate(
			new Scale(
				new UnitSphere(),
				new Value(6)),
			new Vector(-2, 10, -10)),
		new Material()
			.withTransmittance(0.0)
			.withSmoothness(0.99)
			.withColor(new Color(0.8, 0.8, 1.0)))
]);

console.log(renderScene(scene));

const width = 512;
const height = 512;

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl");

gl.getExtension("OES_texture_float");

const textures = [0, 1].map(_ => {
	const texture = gl.createTexture();
	gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, texture);
	gl.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MAG_FILTER, WebGLRenderingContext.NEAREST);
	gl.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MIN_FILTER, WebGLRenderingContext.NEAREST);
	gl.texImage2D(WebGLRenderingContext.TEXTURE_2D, 0, WebGLRenderingContext.RGBA, width, height, 0, WebGLRenderingContext.RGBA, WebGLRenderingContext.FLOAT, null);
	return texture;
});

const framebuffer = gl.createFramebuffer();

const renderShader = gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
gl.shaderSource(renderShader, require("./screen.glsl"));
gl.compileShader(renderShader);

const vertexShader = gl.createShader(WebGLRenderingContext.VERTEX_SHADER);
gl.shaderSource(vertexShader, require("./vertex.glsl"));
gl.compileShader(vertexShader);

const screenShader = gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
gl.shaderSource(screenShader, require("./render.glsl") + renderScene(scene));
gl.compileShader(screenShader);
if (gl.getShaderInfoLog(screenShader))
	throw gl.getShaderInfoLog(screenShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, screenShader);
gl.linkProgram(program);

const renderProgram = gl.createProgram();
gl.attachShader(renderProgram, vertexShader);
gl.attachShader(renderProgram, renderShader);
gl.linkProgram(renderProgram);

const vertices = Array(
	-1, -1,
	-1, 1,
	1, 1,
	1, -1);
const indices = Array(0, 1, 2, 0, 2, 3);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, new Float32Array(vertices), WebGLRenderingContext.STATIC_DRAW);

const indexBuffer = gl.createBuffer()
gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), WebGLRenderingContext.STATIC_DRAW);

gl.useProgram(program);

const resolution = gl.getUniformLocation(program, "resolution");
gl.uniform2f(resolution, width, height);

const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, WebGLRenderingContext.FLOAT, false, 0, 0);

gl.viewport(0, 0, width, height);

let mouse = {x: 0, y: 0};
let clicked = false;

canvas.addEventListener("mousedown", () => clicked = true);
document.addEventListener("mouseup", () => clicked = false);

canvas.addEventListener("mousemove", event => {
	if (clicked) {
		mouse.x += event.movementX / width;
		mouse.y += -event.movementY / width;
	}
});

function step(t: number, odd: Boolean = false) {
	const read = textures[odd ? 0 : 1];
	const write = textures[odd ? 1 : 0];

	gl.useProgram(program);
	gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, read);
	gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(WebGLRenderingContext.FRAMEBUFFER, WebGLRenderingContext.COLOR_ATTACHMENT0, WebGLRenderingContext.TEXTURE_2D, write, 0);
	gl.uniform1f(gl.getUniformLocation(program, "time"), t / 1000.0);
	gl.uniform2f(gl.getUniformLocation(program, "mouse"), mouse.x, mouse.y);
	gl.uniform1i(gl.getUniformLocation(program, "clicked"), clicked ? 1 : 0);
	gl.drawElements(WebGLRenderingContext.TRIANGLES, indices.length, WebGLRenderingContext.UNSIGNED_SHORT, 0);

	gl.useProgram(renderProgram);
	gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
	gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, write);
	gl.drawElements(WebGLRenderingContext.TRIANGLES, indices.length, WebGLRenderingContext.UNSIGNED_SHORT, 0);

	requestAnimationFrame(t => step(t, !odd));
}

step(0);