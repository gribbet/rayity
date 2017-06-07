import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {plane, translate, unitSphere} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const scene = createScene([
	entity(
		plane(value(0, 0, 1), value(2.0)),
		material({
			color: `mod(floor(p.x) + floor(p.y), 2.0) * vec3(0.9) + vec3(0.1)`,
			smoothness: value(0.5)
		})),
	entity(
		unitSphere(),
		material({
			color: value(0.9, 0.5, 0.5),
			transmittance: value(0.9),
			smoothness: value(0.9),
			refraction: value(1.4)
		})),
	entity(
		translate(value(4, 1, 4), unitSphere()),
		material({
			color: value(0, 0, 0),
			emissivity: value(20, 20, 20)
		}))
]);

createViewer(document.body, scene);


