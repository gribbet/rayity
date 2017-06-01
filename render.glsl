precision highp float;

uniform sampler2D texture;
uniform vec2 resolution;
uniform vec2 mouse;
uniform bool clicked;
uniform float time;
varying vec2 uv;

const float PI = 3.14159;
const float MAX_VALUE = 1e30;

const float epsilon = 0.001;
const int maxSteps = 50;
const int bounces = 12;

struct Closest {
    int object;
    float distance;
};

struct Material {
    float transmittance;
    float smoothness;
    float refraction;
    vec3 color;
    vec3 emissivity;
};

Closest calculateClosest(vec3 position);
vec3 calculateNormal(int object, vec3 position);
Material calculateMaterial(int object);

vec2 random(int seed) {
	vec2 s = uv * (1.0 + time + float(seed));
	// implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
	return vec2(
		fract(sin(dot(s.xy, vec2(12.9898, 78.233))) * 43758.5453),
		fract(cos(dot(s.xy, vec2(4.898, 7.23))) * 23421.631));
}

vec3 ortho(vec3 v) {
	// See: http://lolengine.net/blog/2013/09/21/picking-orthogonal-vector-combing-coconuts
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

vec3 spherical(vec2 angle) {
    return vec3(sin(angle.y) * cos(angle.x), sin(angle.y) * sin(angle.x), cos(angle.y));
}

void main() {
    vec3 target = vec3(0, 0, 0);
    float cameraDistance = 50.0;
    vec2 cameraAngle = vec2(-mouse.x * PI, (mouse.y + 1.0) * 0.5 * PI);
    vec3 eye = cameraDistance * spherical(cameraAngle);

    float field = 60.0 * PI / 180.0;
    float focal = length(target - eye);
    float aperture = 0.04 * focal;
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

	vec3 luminance = vec3(1, 1, 1);
	vec3 total = vec3(0, 0, 0);

	for (int bounce = 1; bounce <= bounces; bounce++) {
	    Closest closest;
		vec3 position = from;
		float distance = 0.0;

		for (int step = 1; step <= maxSteps; step++) {
			closest = calculateClosest(position);

		 	distance += closest.distance;
			position = from + direction * distance;

			if (closest.distance < epsilon)
				break;

			distance -= epsilon;
		}

		if (closest.object == 0)
		    break;

        Material material = calculateMaterial(closest.object);

		total += luminance * material.emissivity;
		luminance *= material.color;

		vec3 normal = calculateNormal(closest.object, position);

		if (dot(normal, direction) > 0.0)
			normal = -normal;

		vec2 noise = random(bounce);

		normal = calculateSample(normal, material.smoothness, noise);

		if (noise.y < material.transmittance) {
			from = position - normal * epsilon;
			direction = refract(direction, normal, 1.0 / material.refraction);
		} else {
			from = position + normal * epsilon;
			direction = reflect(direction, normal);
		}
	}

	vec4 original = texture2D(texture, uv * 0.5 - 0.5);

    if (clicked)
        original *= 0.9;

	gl_FragColor = vec4(original.xyz + total, original.w + 1.0);
}
