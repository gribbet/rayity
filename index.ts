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

const renderFragmentShader = gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
gl.shaderSource(renderFragmentShader, `

precision highp float;
varying vec2 uv;
uniform sampler2D texture;

void main() {
	vec4 result = texture2D(texture, uv * 0.5 - 0.5);
	gl_FragColor = vec4(result.xyz / result.w, 1.0);
}

`);
gl.compileShader(renderFragmentShader);

const vertexShader = gl.createShader(WebGLRenderingContext.VERTEX_SHADER);
gl.shaderSource(vertexShader, `

attribute vec2 position;
varying vec2 uv;

void main() {
	gl_Position = vec4(position, 0, 1);
	uv = position.xy;
}

`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `

precision highp float;
uniform sampler2D texture;

#define PI 3.14159
#define MAX_VALUE 1e10

uniform vec2 resolution;
uniform float time;

varying vec2 uv;

const float epsilon = 0.001;
const int maxSteps = 128;
const int bounces = 16;

const vec3 target = vec3(0, 0, 0);
const vec3 eye = vec3(8, 4, -1);

const float field = PI / 4.0;
const float focal = length(target - eye)*0.6;//3.5;
const float aperture = 0.03 * focal;
const vec3 look = normalize(target - eye);
const vec3 qup = vec3(0, 1, 0);
const vec3 up = qup - look * dot(look, qup);
const vec3 right = cross(look, up);

vec2 rand2n(int seed) {
	vec2 s = uv * (1.0 + time + float(seed));
	// implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
	return vec2(
		fract(sin(dot(s.xy, vec2(12.9898, 78.233))) * 43758.5453),
		fract(cos(dot(s.xy, vec2(4.898, 7.23))) * 23421.631));
}

vec3 ortho(vec3 v) {
	//  See : http://lolengine.net/blog/2013/09/21/picking-orthogonal-vector-combing-coconuts
	return abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y);
}

vec3 sampleHemisphere(vec3 normal, int seed) {
	vec3 o1 = normalize(ortho(normal));
	vec3 o2 = normalize(cross(normal, o1));
	vec2 random = rand2n(seed);
	random.x *= 2.0 * PI;
	random.y = sqrt(random.y);
	float q = sqrt(1.0 - random.y * random.y);
	return q * (cos(random.x) * o1  + sin(random.x) * o2) + random.y * normal;
}

vec3 sampleSphere(int seed) {
	vec2 random = rand2n(seed);
	vec2 angle = vec2(1.0 - 2.0 * random.x, 2.0 * PI * random.y);
	return vec3(cos(angle.x) * sin(angle.y), sin(angle.x) * sin(angle.y), cos(angle.y));
}	

float sphereDistance1(vec3 position) {
	return length(position) - 0.5;
}

float sphereDistance(vec3 position) {
	position.x = mod(position.x, 1.0) - 0.5;
	position.z = mod(position.z, 1.0) - 0.5;
	return sphereDistance1(position);
}

vec3 sphereNormal(vec3 position) {
	return normalize(vec3(
		sphereDistance(position + vec3(epsilon, 0, 0)) -
		sphereDistance(position - vec3(epsilon, 0, 0)),
		sphereDistance(position + vec3(0, epsilon, 0)) -
		sphereDistance(position - vec3(0, epsilon, 0)),
		sphereDistance(position + vec3(0, 0, epsilon)) -
		sphereDistance(position - vec3(0, 0, epsilon))));
}

float plane1Distance(vec3 position) {
	return dot(position, vec3(0, 1, 0)) + 5.0;
}

vec3 plane1Normal(vec3 position) {
	return normalize(vec3(
		plane1Distance(position + vec3(epsilon, 0, 0)) -
		plane1Distance(position - vec3(epsilon, 0, 0)),
		plane1Distance(position + vec3(0, epsilon, 0)) -
		plane1Distance(position - vec3(0, epsilon, 0)),
		plane1Distance(position + vec3(0, 0, epsilon)) -
		plane1Distance(position - vec3(0, 0, epsilon))));
}

float plane2Distance(vec3 position) {
	return dot(position, vec3(0, -1, 0)) + 5.0;
}

vec3 plane2Normal(vec3 position) {
	return normalize(vec3(
		plane2Distance(position + vec3(epsilon, 0, 0)) -
		plane2Distance(position - vec3(epsilon, 0, 0)),
		plane2Distance(position + vec3(0, epsilon, 0)) -
		plane2Distance(position - vec3(0, epsilon, 0)),
		plane2Distance(position + vec3(0, 0, epsilon)) -
		plane2Distance(position - vec3(0, 0, epsilon))));
}

float plane3Distance(vec3 position) {
	return dot(position, vec3(0, 0, 1)) + 5.0;
}

vec3 plane3Normal(vec3 position) {
	return normalize(vec3(
		plane3Distance(position + vec3(epsilon, 0, 0)) -
		plane3Distance(position - vec3(epsilon, 0, 0)),
		plane3Distance(position + vec3(0, epsilon, 0)) -
		plane3Distance(position - vec3(0, epsilon, 0)),
		plane3Distance(position + vec3(0, 0, epsilon)) -
		plane3Distance(position - vec3(0, 0, epsilon))));
}

float plane4Distance(vec3 position) {
	return dot(position, vec3(0, 0, -1)) + 5.0;
}

vec3 plane4Normal(vec3 position) {
	return normalize(vec3(
		plane4Distance(position + vec3(epsilon, 0, 0)) -
		plane4Distance(position - vec3(epsilon, 0, 0)),
		plane4Distance(position + vec3(0, epsilon, 0)) -
		plane4Distance(position - vec3(0, epsilon, 0)),
		plane4Distance(position + vec3(0, 0, epsilon)) -
		plane4Distance(position - vec3(0, 0, epsilon))));
}

float plane5Distance(vec3 position) {
	return dot(position, vec3(-1, 0, 0)) + 5.0;
}

vec3 plane5Normal(vec3 position) {
	return normalize(vec3(
		plane5Distance(position + vec3(epsilon, 0, 0)) -
		plane5Distance(position - vec3(epsilon, 0, 0)),
		plane5Distance(position + vec3(0, epsilon, 0)) -
		plane5Distance(position - vec3(0, epsilon, 0)),
		plane5Distance(position + vec3(0, 0, epsilon)) -
		plane5Distance(position - vec3(0, 0, epsilon))));
}

float plane6Distance(vec3 position) {
	return dot(position, vec3(1, 0, 0)) + 5.0;
}

vec3 plane6Normal(vec3 position) {
	return normalize(vec3(
		plane6Distance(position + vec3(epsilon, 0, 0)) -
		plane6Distance(position - vec3(epsilon, 0, 0)),
		plane6Distance(position + vec3(0, epsilon, 0)) -
		plane6Distance(position - vec3(0, epsilon, 0)),
		plane6Distance(position + vec3(0, 0, epsilon)) -
		plane6Distance(position - vec3(0, 0, epsilon))));
}

void main() {
	float aspectRatio = resolution.x / resolution.y;
	vec2 noise = rand2n(0);
	
	vec2 origin = noise.x * aperture * vec2(cos(noise.y * 2.0 * PI), sin(noise.y * 2.0 * PI));

	vec2 px = uv + (noise * 2.0 - 1.0) / resolution.x;
	vec3 screen = eye + (look + tan(field) * (px.x * aspectRatio * right + px.y * up)) * focal;

	vec3 from = eye + right * origin.x + up * origin.y;
	vec3 direction = normalize(screen - from);
	
	vec3 luminance = vec3(1.0, 1.0, 1.0);
	vec3 total = vec3(0, 0, 0);
	float scatter1 = 1e10;
	
	for (int k = 1; k <= bounces; k++) {
		int seed = k;
		float t = 0.0;
		int i = 0;
		vec3 position = from;
		
		for (int j = 1; j <= maxSteps; j++) {
			position = from + direction * t;
			float minimum = MAX_VALUE;
			float distance;
			
			distance = plane1Distance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 1;
			}
			
			distance = plane2Distance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 2;
			}
			
			distance = plane3Distance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 3;
			}
			
			distance = plane4Distance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 4;
			}
			
			distance = plane5Distance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 5;
			}
			
			distance = plane6Distance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 6;
			}
			
			distance = sphereDistance(position);
			if (distance < minimum && distance > 0.0) {
				minimum = distance;
				i = 7;
			}
			
			if (minimum < epsilon)
		 		break;
		 	
		 	t += minimum;
		 	
		}
		
		vec4 random = vec4(rand2n(seed), rand2n(seed + 1));
		 	
		
		if (exp(-t / scatter1) < random.x) {
			from = position - (t + epsilon * 2.0) * direction;
			direction = sampleSphere(seed);
			scatter1 = MAX_VALUE;
			continue;
		}
		
		if (i == 0) {
			total += luminance;
			break;
		} else {
			vec3 normal;
				 
			if (i == 1)
				normal = plane1Normal(position);
			else if (i == 2)
				normal = plane2Normal(position);
			else if (i == 3)
				normal = plane3Normal(position);
			else if (i == 4)
				normal = plane4Normal(position);
			else if (i == 5)
				normal = plane5Normal(position);
			else if (i == 6)
				normal = plane6Normal(position);
			else if (i == 7)
				normal = sphereNormal(position);
				
			vec3 emissive = vec3(0, 0, 0);
			float reflectivity = 0.0;
			float refraction = 1.5;
			float scatter = 0.0;
			vec3 color = vec3(1, 1, 1) * 0.9;
			
			if (i == 1) {
				emissive = vec3(1, 1, 1) * 1.6;
				color = vec3(0, 0, 0);
			}
				
			if (i == 7) {
				reflectivity = 0.1;
				scatter = 2.0;
				color = vec3(1, 0.9, 0.9);
			}
			
			total += luminance * emissive;
				
			luminance = luminance * color;
			
			if (random.y < reflectivity) {
			 	from = position + normal * epsilon;
			 	direction = reflect(direction, normal);
			} else if (scatter == 0.0) {
			 	from = position + normal * epsilon;
			 	direction = sampleHemisphere(normal, seed);
			} else {
			 	from = position - normal * epsilon;
				direction = refract(direction, normal, 1.0/refraction);
				scatter1 = scatter;
			}
		}
	}
	
	vec4 original = texture2D(texture, uv * 0.5 - 0.5);
	gl_FragColor = vec4(original.xyz + total, original.w + 1.0);	
}

`);
gl.compileShader(fragmentShader);
if (gl.getShaderInfoLog(fragmentShader))
	throw gl.getShaderInfoLog(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const renderProgram = gl.createProgram();
gl.attachShader(renderProgram, vertexShader);
gl.attachShader(renderProgram, renderFragmentShader);
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

const time = gl.getUniformLocation(program, "time");
gl.uniform1f(time, 0);

const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, WebGLRenderingContext.FLOAT, false, 0, 0);

gl.viewport(0, 0, width, height);

function step(t: number, odd: Boolean = false) {
	const read = textures[odd ? 0 : 1];
	const write = textures[odd ? 1 : 0];

	gl.useProgram(program);
	gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, read);
	gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(WebGLRenderingContext.FRAMEBUFFER, WebGLRenderingContext.COLOR_ATTACHMENT0, WebGLRenderingContext.TEXTURE_2D, write, 0);
	gl.uniform1f(time, t / 1000.0);
	gl.drawElements(WebGLRenderingContext.TRIANGLES, indices.length, WebGLRenderingContext.UNSIGNED_SHORT, 0);

	gl.useProgram(renderProgram);
	gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
	gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, write);
	gl.drawElements(WebGLRenderingContext.TRIANGLES, indices.length, WebGLRenderingContext.UNSIGNED_SHORT, 0);

	requestAnimationFrame(t => step(t, !odd));
}

step(0);