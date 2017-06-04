import {Shape} from "./shape";
import {Entity} from "./entity";
import {Scene} from "./scene";
import {Code, value, variable} from "./expression";

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

function buildEntity(entity: Entity): Code {
	return `
		${buildShape(entity.shape)}
	
		float distance${entity.id}(vec3 p) {
			return ${entity.shape.call(variable("p"))};
		}
		
		vec3 normal${entity.id}(vec3 p) {
			return normalize(vec3(
				distance${entity.id}(p + vec3(epsilon, 0, 0)) -
				distance${entity.id}(p - vec3(epsilon, 0, 0)),
				distance${entity.id}(p + vec3(0, epsilon, 0)) -
				distance${entity.id}(p - vec3(0, epsilon, 0)),
				distance${entity.id}(p + vec3(0, 0, epsilon)) -
				distance${entity.id}(p - vec3(0, 0, epsilon))));
		}
		
		Material material${entity.id}(vec3 p, vec3 n, vec3 d) {
			Material m;
			m.transmittance = ${entity.material.transmittance}.x;
			m.smoothness = ${entity.material.smoothness}.x;
			m.refraction = ${entity.material.refraction}.x;
			m.color = ${entity.material.color};
			m.emissivity = ${entity.material.emissivity};
			return m;
		}`;
}

export function buildScene(scene: Scene): Code {
	return scene.entities
			.map(_ => buildEntity(_))
			.reduce((a, b) => a + b, "") + `
		
		Closest calculateClosest(vec3 position) {
			Closest closest;
			float distance;
		
			closest.object = 0;
			closest.distance = MAX_VALUE;` +

		scene.entities
			.map((entity, i) => `
			
			distance = abs(distance${entity.id}(position));
			if (distance < closest.distance) {
				closest.distance = distance;
				closest.object = ${entity.id};
			}`)
			.reduce((a, b) => a + b, "") + `
			
			return closest;
		}
		
		vec3 calculateNormal(int object, vec3 position) {` +

		scene.entities
			.map((entity, i) => `
			
			if (object == ${entity.id})
				return normal${entity.id}(position);`)
			.reduce((a, b) => a + b, "") + `
			
			return vec3(0, 0, 0);
		}
		
		Material calculateMaterial(int object, vec3 position, vec3 normal, vec3 direction) {` +

		scene.entities
			.map((entity, i) => `
			
			if (object == ${entity.id})
				return material${entity.id}(position, normal, direction);`)
			.reduce((a, b) => a + b, "") + `
			
			Material material;
			return material;
		}`;
}