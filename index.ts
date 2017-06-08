import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {plane, translate, unitBox, unitSphere} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const scene = createScene([
		entity(
			plane(value(0, 0, 1), value(1)),
			material({
				color: `mod(floor(p.x) + floor(p.y), 2.0) * vec3(0.9) + vec3(0.1)`,
				smoothness: value(0.9)
			})),
		entity(
			plane(value(0, 0, -1), value(10)),
			material({
				color: value(0, 0, 0),
				emissivity: value(1, 1, 1),
			})),
		entity(
			unitBox(),
			material({
				color: value(0.9, 0.5, 0.5),
				smoothness: value(1),
				transmittance: value(1),
				scatter: value(0.02)
			})),
		entity(
			translate(value(3, 0, 0), unitSphere()),
			material({
				color: value(0.8, 0.8, 0.8),
				smoothness: value(0.95)
			})),
		entity(
			translate(value(-3, 0, 0), unitSphere()),
			material({
				color: value(0.8, 0.8, 1.0),
				smoothness: value(0.995),
				refraction: value(1.4),
				transmittance: value(0.95)
			}))
	])
;

createViewer(document.body, scene);


