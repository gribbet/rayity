import {Scene} from "./Scene";
import {Shape} from "./Shape";
import {ColorValue, Expression, Value, Variable} from "./Expression";
declare function require(name: string): string;


const width = 512;
const height = 512;

export class Renderer {
	public readonly render: () => void;
	public mouse = {x: 0, y: 0};
	public clicked = false;

	constructor(private gl: WebGLRenderingContext, scene: Scene) {
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

		const indexBuffer = gl.createBuffer()
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

		this.render = function () {
			const read = textures[odd ? 0 : 1];
			const write = textures[odd ? 1 : 0];

			const t = new Date().getTime() - start;

			gl.useProgram(program);
			gl.bindTexture(gl.TEXTURE_2D, read);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write, 0);
			gl.uniform1f(gl.getUniformLocation(program, "time"), t / 1000.0);
			gl.uniform2f(gl.getUniformLocation(program, "mouse"), this.mouse.x, this.mouse.y);
			gl.uniform1i(gl.getUniformLocation(program, "clicked"), this.clicked ? 1 : 0);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			gl.useProgram(renderProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, write);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			odd = !odd;
		};
	}

	private buildScene(scene: Scene): string {
		return scene.shapes
				.map(_ => this.buildShape(_))
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

	private buildShape(shape: Shape): string {
		let x = shape.f.value(new Variable("a"));
		let transmittance = new Value(shape.material.transmittance);
		let smoothness = new Value(shape.material.smoothness);
		let refraction = new Value(shape.material.refraction);
		let color = new ColorValue(shape.material.color);
		let emissivity = new ColorValue(shape.material.emissivity);

		return `
		float distance${shape.id}(vec3 position) {
			vec4 a = vec4(position, 0);
			${this.buildExpression(x)}
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
			${this.buildExpression(transmittance)}
			${this.buildExpression(smoothness)}
			${this.buildExpression(refraction)}
			${this.buildExpression(color)}
			${this.buildExpression(emissivity)}
			Material m;
			m.transmittance = ${transmittance}.x;
			m.smoothness = ${smoothness}.x;
			m.refraction = ${refraction}.x;
			m.color = ${color}.xyz;
			m.emissivity = ${emissivity}.xyz;
			return m;
		}`;
	}

	private buildExpression(x: Expression): string {
		return this.dependencies(x)
			.map(x => `vec4 ${x.id} = ${x.value};`)
			.reduce((a, b) => a + b, "");
	}

	private dependencies(x: Expression): Expression[] {
		let all = x.dependencies
			.map(y => this.dependencies(y))
			.reduce((a, b) => a.concat(b), [])
			.concat(x);
		return all
			.filter((x, i) => all.indexOf(x) == i);

	}
}