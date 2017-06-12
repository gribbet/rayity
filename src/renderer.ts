import {buildScene} from "./build";
import {Scene} from "./scene";

export type Renderer = {
	render: () => void;
}

export function createRenderer(
	gl: WebGLRenderingContext,
	scene: Scene,
	options1: {
		width?: number,
		height?: number,
		epsilon?: number,
		steps?: number,
		bounces?: number
	},
	variables: {
		time: number,
		clicked: boolean,
		mouse: {
			x: number,
			y: number
		}
	}): Renderer {
			
	const options = {
		width: options1.width || 512,
		height: options1.height || 512,
		epsilon: options1.epsilon || 0.001,
		steps: options1.steps || 100,
		bounces: options1.bounces || 5
	}

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
			gl_FragColor = vec4(pow(result.xyz / result.w, vec3(1.0 / 2.2)), 1.0);
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

	console.log(buildScene(scene));

	const screenShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(screenShader, `
		precision highp float;
	
		uniform sampler2D texture;
		uniform vec2 resolution;
		uniform vec2 mouse;
		uniform bool clicked;
		uniform float time;
		varying vec2 uv;
		
		const float PI = 3.14159;
		const float MAX_VALUE = 1e10;
		
		const float epsilon = ${options.epsilon};
		const int steps = ${options.steps};
		const int bounces = ${options.bounces};
		
		struct Closest {
			int object;
			float distance;
		};
		
		struct Material {
			float transmittance;
			float smoothness;
			float refraction;
			float scatter;
			vec3 color;
			vec3 emissivity;
		};
		
		Closest calculateClosest(vec3 position);
		vec3 calculateNormal(int object, vec3 position);
		Material calculateMaterial(int object, vec3 position, vec3 normal, vec3 direction);
		
		vec2 random(int seed) {
			vec2 s = uv * (1.0 + time + float(seed));
			return vec2(
				fract(sin(dot(s.xy, vec2(12.9898, 78.233))) * 43758.5453),
				fract(cos(dot(s.xy, vec2(4.898, 7.23))) * 23421.631));
		}
		
		vec3 ortho(vec3 v) {
			return abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y);
		}
		
		vec3 calculateSample(vec3 normal, float smoothness, vec2 noise) {
			vec3 o1 = normalize(ortho(normal));
			vec3 o2 = normalize(cross(normal, o1));
			noise.x *= 2.0 * PI;
			noise.y = sqrt(smoothness + (1.0 - smoothness) * noise.y);
			float q = sqrt(1.0 - noise.y * noise.y);
			return q * (cos(noise.x) * o1  + sin(noise.x) * o2) + noise.y * normal;
		}
		
		vec3 sampleSphere(vec2 noise) {
			noise.x *= 2.0 * PI;
			noise.y = noise.y * 2.0 - 1.0;
			float q = sqrt(1.0 - noise.y * noise.y);
			return vec3(q * cos(noise.x), q * sin(noise.x), noise.y);
		}
		
		vec3 spherical(vec2 angle) {
			return vec3(sin(angle.y) * cos(angle.x), sin(angle.y) * sin(angle.x), cos(angle.y));
		}
		
		void main() {
			vec3 target = vec3(0, 0, 0);
			float cameraDistance = 0.1;
			vec2 cameraAngle = vec2(-mouse.x * PI, (mouse.y + 1.0) * 0.5 * PI);
			vec3 eye = cameraDistance * spherical(cameraAngle);
		
			float field = 80.0 * PI / 180.0;
			float focal = length(target - eye);
			float aperture = 0.001 * focal;
			vec3 look = normalize(target - eye);
			vec3 up = normalize(target - spherical(vec2(cameraAngle.x, cameraAngle.y + PI * 0.5)));
			vec3 right = cross(look, up);
			float aspectRatio = resolution.x / resolution.y;
		
			vec2 noise = random(0);
		
			vec2 origin = noise.x * aperture * vec2(cos(noise.y * 2.0 * PI), sin(noise.y * 2.0 * PI));
		
			vec2 px = uv + (noise * 2.0 - 1.0) / resolution.x;
			vec3 screen = eye + (look + tan(field * 0.5) * (px.x * aspectRatio * right + px.y * up)) * focal;
		
			vec3 from = eye + right * origin.x + up * origin.y;
			vec3 direction = normalize(screen - from);
		
		
			vec3 total = vec3(0, 0, 0);
			vec3 luminance = vec3(1, 1, 1);
			Material air;
			air.scatter = MAX_VALUE;
			air.refraction = 1.0;
			Material current = air;
		
			for (int bounce = 1; bounce <= bounces; bounce++) {
				Closest closest;
				vec3 position = from;
				float distance = 0.0;
		
				vec2 noise = random(bounce);
		
				float max = -log(noise.y) * current.scatter;
		
				for (int step = 1; step <= steps; step++) {
					closest = calculateClosest(position);
		
					if (closest.distance < epsilon) {
						distance = distance + closest.distance;
						position = from + direction * distance;
						break;
					}
		
					if (distance > max) {
						distance = max;
						position = from + direction * distance;
						break;
					}
		
					distance = distance + closest.distance * 0.5;
					position = from + direction * distance;
					distance -= epsilon;
				}
		
				if (closest.object == 0)
					break;
		
				if (distance == max) {
					from = position;
					direction = sampleSphere(noise);
					total += luminance * current.emissivity;
					luminance *= current.color;
					continue;
				}
		
				vec3 normal = calculateNormal(closest.object, position);
		
				Material material = calculateMaterial(closest.object, position, normal, direction);
		
				bool backface = dot(normal, direction) > 0.0;
				if (backface)
					normal = -normal;
		
				normal = calculateSample(normal, material.smoothness, noise);
		
				if (noise.y < material.transmittance) {
					from = position - 2.0 * direction * epsilon / dot(direction, normal);
					direction = refract(direction, normal, current.refraction / material.refraction);
		
					if (backface)
						current = air;
					else
						current = material;
				} else {
					from = position;
					direction = reflect(direction, normal);
		
					total += luminance * material.emissivity;
					luminance *= material.color;
				}
			}
		
			vec4 original = texture2D(texture, uv * 0.5 - 0.5);
		
			if (clicked)
				original *= 0.5;
		
			gl_FragColor = vec4(original.xyz + total, original.w + 1.0);
		}` + buildScene(scene));
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

			gl.useProgram(program);
			gl.bindTexture(gl.TEXTURE_2D, read);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write, 0);
			gl.uniform1f(gl.getUniformLocation(program, "time"), variables.time);
			gl.uniform2f(gl.getUniformLocation(program, "mouse"), variables.mouse.x, variables.mouse.y);
			gl.uniform1i(gl.getUniformLocation(program, "clicked"), variables.clicked ? 1 : 0);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			gl.useProgram(renderProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, write);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

			odd = !odd;
		}
	};
}