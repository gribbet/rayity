type Expression = string;
type Code = string;
declare function require(name: string): string;

type Color = {
	red: number,
	green: number,
	blue: number
}

export function color(red: number, green: number, blue: number) {
	return {
		red: red,
		green: green,
		blue: blue
	};
}

type Material = {
	transmittance: number,
	smoothness: number,
	refraction: number,
	color: Color,
	emissivity: Color
}


export function material(values: {
							 transmittance?: number,
							 smoothness?: number,
							 refraction?: number,
							 color?: Color,
							 emissivity?: Color
						 }) {
	return {
		transmittance: values.transmittance || 0.0,
		smoothness: values.smoothness || 0.0,
		refraction: values.refraction || 1.0,
		color: values.color || color(1, 1, 1),
		emissivity: values.emissivity || color(0, 0, 0)
	};
}

type Shape = {
	id: number,
	distanceFunction: DistanceFunction,
	material: Material
}
let lastId = 1;
export function shape(distanceFunction: DistanceFunction, material: Material) {
	return {
		id: lastId++,
		distanceFunction: distanceFunction,
		material: material
	};
}

type Scene = {
	shapes: Shape[]
}

export function createScene(shapes: Shape[]) {
	return {
		shapes: shapes
	};
}

export function value(x: number = 0,
					  y: number = 0,
					  z: number = 0): Expression {
	return `vec3(${x.toPrecision(6)}, ${y.toPrecision(6)}, ${z.toPrecision(6)})`;
}

export function variable(name: string): Expression {
	return name;
}

type DistanceFunction = {
	readonly id: number,
	readonly body: Code,
	readonly dependencies: DistanceFunction[],
	readonly call: (_: Expression) => Expression,
}


function distanceFunction(body: string,
						  dependencies: DistanceFunction[] = []) {
	let id = lastId++;
	return {
		body: body,
		dependencies: dependencies,
		id: id,
		call: (x: Expression) => `f${id}(${x})`
	};
}

export function unitSphere(): DistanceFunction {
	return distanceFunction(`return length(p) - 1.0;`);
}

export function plane(normal: Expression, offset: Expression) {
	return distanceFunction(`return dot(p, ${normal}) + ${offset}.x;`);
}

export function translate(x: Expression, f: DistanceFunction) {
	return distanceFunction(`return ${f.call(`p - ${x}`)};`, [f]);
}

export function scale(x: Expression, f: DistanceFunction) {
	return distanceFunction(`return ${f.call(`p / ${x}`)} * length(${x});`, [f]);
}

function buildDistanceFunction(f: DistanceFunction) {
	return dependencies(f)
			.map(f => `
				float f${f.id}(vec3 p) {
					${f.body}
				}`)
			.reduce((a, b) => a + "\n" + b, "") + "\n\n";
}

function dependencies(f: DistanceFunction): DistanceFunction[] {
	let all: DistanceFunction[] = f.dependencies
		.map(y => dependencies(y))
		.reduce((a, b) => a.concat(b), [])
		.concat(f);
	return all
		.filter((x, i) => all.indexOf(x) == i);
}

function buildShape(shape: Shape): Code {

	return `
		${buildDistanceFunction(shape.distanceFunction)}
	
		float distance${shape.id}(vec3 p) {
			return ${shape.distanceFunction.call(variable("p"))};
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
			Material m;
			m.transmittance = ${value(shape.material.transmittance)}.x;
			m.smoothness = ${value(shape.material.smoothness)}.x;
			m.refraction = ${value(shape.material.refraction)}.x;
			m.color = ${value(shape.material.color.red, shape.material.color.green, shape.material.color.blue)};
			m.emissivity = ${value(shape.material.emissivity.red, shape.material.emissivity.green, shape.material.emissivity.blue)};
			return m;
		}`;
}

export function buildScene(scene: Scene): Code {
	return scene.shapes
			.map(_ => buildShape(_))
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
		}`;
}

const width = 512;
const height = 512;

export function createRenderer(gl: WebGLRenderingContext,
							   scene: Scene,
							   settings: {
								   clicked: boolean,
								   mouse: {
									   x: number,
									   y: number
								   }
							   }) {
	if (!gl.getExtension("OES_texture_float"))
		throw "No float texture support";

	const textures = [0, 1].map(_ => {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
		return texture;
	});

	const framebuffer = gl.createFramebuffer();

	const renderShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(renderShader, require("./screen.glsl"));
	gl.compileShader(renderShader);

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, require("./vertex.glsl"));
	gl.compileShader(vertexShader);

	console.log(buildScene(scene));

	const screenShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(screenShader, require("./render.glsl") + this.buildScene(scene));
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
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	gl.useProgram(program);

	const resolution = gl.getUniformLocation(program, "resolution");
	gl.uniform2f(resolution, width, height);

	const position = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	gl.viewport(0, 0, width, height);

	let odd = false;
	const start = new Date().getTime();

	return {
		render: function () {
			const read = textures[odd ? 0 : 1];
			const write = textures[odd ? 1 : 0];

			const t = new Date().getTime() - start;

			gl.useProgram(program);
			gl.bindTexture(gl.TEXTURE_2D, read);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write, 0);
			gl.uniform1f(gl.getUniformLocation(program, "time"), t / 1000.0);
			gl.uniform2f(gl.getUniformLocation(program, "mouse"), settings.mouse.x, settings.mouse.y);
			gl.uniform1i(gl.getUniformLocation(program, "clicked"), settings.clicked ? 1 : 0);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			gl.useProgram(renderProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, write);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			odd = !odd;
		}
	};
}

