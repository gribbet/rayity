import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {scale, sierpinski, unitBox, unitCylinder, unitSphere} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const scene = createScene([
	entity(
		scale(value(10), unitSphere()),
		material({
			color: value(0, 0, 0),
			emissivity: value(1, 1, 1)
		})),
	entity(
		scale(value(0.5),
			sierpinski(4, scale(value(1.4), unitSphere()))),
		material({
			smoothness: value(1.0),
			emissivity: `vec3(0.8, 0.7, 0.8) * dot(n, normalize(vec3(1, 2, 3)))`
		}))
]);

createViewer(document.body, scene);


