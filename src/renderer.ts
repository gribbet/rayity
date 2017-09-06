import { build } from './build';
import { Options } from './options';
import { Scene } from './scene';

export interface Renderer {
	readonly render: () => void;
}

export function createRenderer(
	gl: WebGLRenderingContext,
	scene: Scene,
	options: Options,
	variables?: {
		time: number,
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
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, options.width, options.height, 0, gl.RGBA, gl.FLOAT, null);
		return texture;
	});

	const framebuffer = gl.createFramebuffer();

	const renderShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(renderShader, `
		precision highp float;

		varying vec2 uv;
		uniform sampler2D texture;
		
		void main() {
			vec4 result = texture2D(texture, uv * 0.5 - 0.5);
			gl_FragColor = vec4(pow(result.xyz / result.w, vec3(1.0 / ${options.gamma.toFixed(10)})), 1.0);
		}`);
	gl.compileShader(renderShader);

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, `
		attribute vec2 position;
		varying vec2 uv;
		
		void main() {
			gl_Position = vec4(position, 0, 1);
			uv = position.xy;
		}`);
	gl.compileShader(vertexShader);

	const screenShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(screenShader, build(scene, options));
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
	gl.uniform2f(resolution, options.width, options.height);

	const position = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	gl.viewport(0, 0, options.width, options.height);

	let odd = false;

	return {
		render: function () {
			const read = textures[odd ? 0 : 1];
			const write = textures[odd ? 1 : 0];

			const variables_ = Object.assign({
				time: 0,
				clicked: false,
				mouse: { x: 0, y: 0 }
			}, variables || {});

			gl.useProgram(program);
			gl.bindTexture(gl.TEXTURE_2D, read);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write, 0);
			gl.uniform1f(gl.getUniformLocation(program, "time"), variables_.time);
			gl.uniform2f(gl.getUniformLocation(program, "mouse"), variables_.mouse.x, variables_.mouse.y);
			gl.uniform1i(gl.getUniformLocation(program, "clicked"), variables_.clicked ? 1 : 0);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			gl.useProgram(renderProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, write);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			odd = !odd;
		}
	};
}