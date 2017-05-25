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
#define MAX_VALUE 1e30

uniform vec2 resolution;
uniform float time;

varying vec2 uv;

const float epsilon = 0.005;
const int maxSteps = 128;
const int bounces = 16;

const vec3 target = vec3(0, 0, 0);
const vec3 eye = vec3(-8, 8, 2) * 0.5;

const float field = PI / 4.0;
const float focal = length(target - eye);//3.5;
const float aperture = 0.07 * focal;
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

float sphereDistance3(vec3 position) {
	return length(position) - 2.0;
}

float sphereDistance2( vec3 p )
{
vec2 t = vec2(2.0, 0.33);
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sphereDistance1(vec3 position) {
	return length(position) - 0.45;
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

vec3 sphereNormal2(vec3 position) {
	return normalize(vec3(
		sphereDistance2(position + vec3(epsilon, 0, 0)) -
		sphereDistance2(position - vec3(epsilon, 0, 0)),
		sphereDistance2(position + vec3(0, epsilon, 0)) -
		sphereDistance2(position - vec3(0, epsilon, 0)),
		sphereDistance2(position + vec3(0, 0, epsilon)) -
		sphereDistance2(position - vec3(0, 0, epsilon))));
}

vec3 sphereNormal3(vec3 position) {
	return normalize(vec3(
		sphereDistance3(position + vec3(epsilon, 0, 0)) -
		sphereDistance3(position - vec3(epsilon, 0, 0)),
		sphereDistance3(position + vec3(0, epsilon, 0)) -
		sphereDistance3(position - vec3(0, epsilon, 0)),
		sphereDistance3(position + vec3(0, 0, epsilon)) -
		sphereDistance3(position - vec3(0, 0, epsilon))));
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
	int i3 = 0;
	
	for (int k = 1; k <= bounces; k++) {
		int seed = k;
		float t = 0.0;
		int i = 0;
		vec3 position = from;

		for (int j = 1; j <= maxSteps; j++) {
			float minimum = MAX_VALUE;
			float distance;
			
			distance = abs(plane1Distance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 1;
			}
			
			distance = abs(plane2Distance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 2;
			}
			
			distance = abs(plane3Distance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 3;
			}
			
			distance = abs(plane4Distance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 4;
			}
			
			distance = abs(plane5Distance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 5;
			}
			
			distance = abs(plane6Distance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 6;
			}
			
			distance = abs(sphereDistance2(position));
			if (distance < minimum) {
				minimum = distance;
				i = 7;
			}
			
			distance = abs(sphereDistance(position));
			if (distance < minimum) {
				minimum = distance;
				i = 8;
			}
			
			distance = abs(sphereDistance3(position));
			if (distance < minimum) {
				minimum = distance;
				i = 9;
			}
		 	
		 	t += minimum;
			position = from + direction * t;
			
			if (minimum < epsilon)
				break;
		}
		
		from = position;
		
		if (i == 0) {
			//total += luminance;
			break;
		}
		
		/*float scatter1 = MAX_VALUE;
		if (i3 == 7)
			scatter1 = 0.1;
		
		/*vec2 test3 = rand2n(seed + 7);
		float testy = 1.0 - exp(-t/scatter1);
		
		if (scatter1 != MAX_VALUE && testy > test3.x) {
			//from = position + direction * t * test3.y;
			direction = sampleSphere(seed + 1);
			//scatter1 = MAX_VALUE;
			luminance = luminance * vec3(1.0, 0.9, 0.9);
			//total += luminance;
			//i3 = 0;
			//luminance = vec3(1, 0.9, 0.9) * 1.0 * t * 0.1;
			continue;
		}
		
		if (i3 == 7) {
			luminance = luminance * (exp(-t * 0.2));
		}
		
		i3 = 0;*/ 
		
		//i3 = i;
		
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
			normal = sphereNormal2(position);
		else if (i == 8)
			normal = sphereNormal(position);
		else if (i == 9)
			normal = sphereNormal3(position);
			
		//if (inside) normal = -normal;
			
		vec3 emissive = vec3(0, 0, 0);
		float reflectance = 1.0;
		float refraction = 1.4;
		float diffusivity = 1.0;
		vec3 color = vec3(1, 1, 1) * 1.0;
			
		if (i == 8 || i == 9) {
			reflectance = 0.1;
			diffusivity = 0.2;
			color = vec3(0.99, 0.9, 0.9) * 1.0;
			//emissive = vec3(1, 0, 0);
		}
		
		if (i >= 1 && i <= 6) {
			reflectance = 1.0;
			diffusivity = 1.0;
			color = vec3(1, 1, 1) * 0.5;
		}
		
		if (i == 2) {
			emissive = vec3(1, 1, 1) * 4.0;
			color = vec3(0, 0, 0);
		}
		
		if (i == 7) {
			reflectance = 1.0;
			diffusivity = 0.1;
			color = vec3(1, 1, 1) * 0.5;
		}
		
		total += luminance * emissive;
		
		
		luminance = luminance * color;
		
		vec2 test = rand2n(seed);
		
		if (dot(normal, direction) > 0.0)
			normal = -normal;
		
		if (test.x < reflectance) {
			
			from = from + normal * epsilon;
			
			if (test.y < diffusivity) 
				direction = sampleHemisphere(normal, seed + 2);
			else
				direction = reflect(direction, normal);
		} else {
			from = from - normal * epsilon;
			
			if (test.y < diffusivity)
				direction = sampleHemisphere(-normal, seed + 4);
			else
				direction = refract(direction, normal, 1.0/refraction);
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