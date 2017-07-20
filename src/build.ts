import { Shape } from "./shape";
import { Model } from "./model";
import { Scene } from "./scene";
import { Code, variable } from "./expression";

function buildShape(shape: Shape) {
	return dependencies(shape)
		.map(shape => `
				float shape${shape.id}(vec3 p) {
					${shape.body}
				}`)
		.reduce((a, b) => a + "\n" + b, "");
}

function dependencies(shape: Shape): Shape[] {
	let all: Shape[] = shape.dependencies
		.map(_ => dependencies(_))
		.reduce((a, b) => a.concat(b), [])
		.concat(shape);
	return all
		.filter((x, i) => all.indexOf(x) == i);
}

function buildModel(model: Model): Code {
	return `
		${buildShape(model.shape)}
	
		float distance${model.id}(vec3 p) {
			return ${model.shape.call(variable("p"))};
		}
		
		vec3 normal${model.id}(vec3 p) {
			const vec3 a = vec3( 1, 1, 1) / sqrt(3.0);
			const vec3 b = vec3( 1,-1,-1) / sqrt(3.0);
			const vec3 c = vec3(-1, 1,-1) / sqrt(3.0);
			const vec3 d = vec3(-1,-1, 1) / sqrt(3.0);
			float z = distance${model.id}(p);
			return normalize(
				a * (distance${model.id}(p + a * epsilon) - z) + 
				b * (distance${model.id}(p + b * epsilon) - z) +
				c * (distance${model.id}(p + c * epsilon) - z) +
				d * (distance${model.id}(p + d * epsilon) - z));
		}
		
		Material material${model.id}(vec3 p, vec3 n, vec3 d) {
			Material m;
			m.transmittance = ${model.material.transmittance}.x;
			m.smoothness = ${model.material.smoothness}.x;
			m.refraction = ${model.material.refraction}.x;
			m.scatter = ${model.material.scatter}.x;
			m.color = ${model.material.color};
			m.emissivity = ${model.material.emissivity};
			return m;
		}`;
}

function buildScene(scene: Scene): Code {
	return scene.models
		.map(_ => buildModel(_))
		.reduce((a, b) => a + b, "") + `
		
		Closest calculateClosest(vec3 position) {
			Closest closest;
			float distance;
		
			closest.object = 0;
			closest.distance = MAX_VALUE;` +

		scene.models
			.map((model, i) => `
			
			distance = abs(distance${model.id}(position));
			if (distance < closest.distance) {
				closest.distance = distance;
				closest.object = ${model.id};
			}`)
			.reduce((a, b) => a + b, "") + `
			
			return closest;
		}
		
		vec3 calculateNormal(int object, vec3 position) {` +

		scene.models
			.map((model, i) => `
			
			if (object == ${model.id})
				return normal${model.id}(position);`)
			.reduce((a, b) => a + b, "") + `
			
			return vec3(0, 0, 0);
		}
		
		Material calculateMaterial(int object, vec3 position, vec3 normal, vec3 direction) {` +

		scene.models
			.map((model, i) => `
			
			if (object == ${model.id})
				return material${model.id}(position, normal, direction);`)
			.reduce((a, b) => a + b, "") + `
			
			Material material;
			return material;
		}`;
}

export function build(
	scene: Scene,
	options: {
		width: number,
		height: number,
		epsilon: number,
		steps: number,
		bounces: number
		iterations: number,
		memory: number
	}): Code {
	const code = `
	precision highp float;

	uniform sampler2D texture;
	uniform vec2 resolution;
	uniform vec2 mouse;
	uniform bool clicked;
	uniform float time;
	varying vec2 uv;

	const float PI = 3.14159;
	const float MAX_VALUE = 1e5;

	const float epsilon = ${options.epsilon};
	const int steps = ${options.steps};
	const int bounces = ${options.bounces};
	const int iterations = ${options.iterations};

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
		vec2 s = (uv + vec2(1, 1)) * (1.0 + time + float(seed));
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
		return vec3(sin(angle.y) * cos(angle.x), cos(angle.y), sin(angle.y) * sin(angle.x));
	}

	void main() {
		vec3 eye = ${scene.camera.eye};
		vec3 target = ${scene.camera.target};
		vec3 up = ${scene.camera.up};
		float fieldOfView = ${scene.camera.fieldOfView}.x;
		float aperture = ${scene.camera.aperture}.x;

		vec3 look = normalize(target - eye);
		up = normalize(up - dot(look, up) * look);
		vec3 right = cross(look, up);
		
		vec3 total;

		for(int iteration = 1; iteration <= iterations; iteration++) {
			vec2 noise = random(iteration);
	
			vec2 offset = noise.x * aperture * vec2(cos(noise.y * 2.0 * PI), sin(noise.y * 2.0 * PI));
			vec3 from = eye + offset.x * right + offset.y * up;
	
			vec2 angle = (uv * 0.5 + (noise - 0.5) / resolution) * fieldOfView;
			vec3 screen = vec3(cos(angle.y) * sin(angle.x), sin(angle.y), cos(angle.y) * cos(angle.x));
			vec3 to = eye + length(target - eye) * (right * screen.x + up * screen.y + look * screen.z);
	
			vec3 direction = normalize(to - from);
	
			vec3 luminance = vec3(1);

			Material air;
			air.refraction = ${scene.air.refraction}.x;
			air.scatter = ${scene.air.scatter}.x;
			air.emissivity = ${scene.air.emissivity};
			air.color = ${scene.air.color};

			Material current = air;
	
			for (int bounce = 1; bounce <= bounces; bounce++) {
				Closest closest;
				vec3 position = from;
				float distance = 0.0;
	
				vec2 noise = random(iteration * bounces + bounce);
	
				float scatter = -log(noise.y) * current.scatter;
	
				for (int step = 1; step <= steps; step++) {
					closest = calculateClosest(position);

					if (closest.distance < epsilon)
						break;
	
					distance = distance + closest.distance * 0.5;
					distance = min(distance, scatter);					
					position = from + direction * distance;

					if (distance == scatter)
						break;
				}

				if (closest.object == 0)
					break;
	
				if (distance == scatter) {
					from = position;
					direction = sampleSphere(noise);
					total += luminance * current.emissivity;
					luminance *= current.color;
					continue;
				}
	
				vec3 normal = calculateNormal(closest.object, position);

				Material material = calculateMaterial(closest.object, position, normal, direction);

				total += luminance * material.emissivity;

				if (material.color == vec3(0))
					break;
	
				bool backface = dot(direction, normal) > 0.0; 
				if (backface)
					normal = -normal; 
	
				normal = calculateSample(normal, material.smoothness, noise);
				
				if (noise.y < material.transmittance) {
					float eta = air.refraction / material.refraction;
					if (backface)
						eta = 1.0 / eta;
				
					vec3 refracted = refract(direction, normal, eta);
					if (refracted != vec3(0)) {
						from = position - 2.0 * epsilon * normal;
						direction = refracted;
						current = material;
					 	if (backface)
							current = air;
						continue;
					}
				}

				luminance *= material.color;				
				from = position + epsilon * normal;
				direction = reflect(direction, normal);
			}
		}
 
		vec4 original = texture2D(texture, uv * 0.5 - 0.5);
		
		if (clicked) 
			original *= 0.5;

		original *= ${options.memory}; 
			
		gl_FragColor = original + vec4(total, iterations);

	}` + buildScene(scene);

	console.log(code);

	return code;
}