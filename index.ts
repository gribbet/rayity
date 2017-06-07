import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {plane, scale, sierpinski, unitSphere} from "./src/shape";
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
		plane(value(0, 0, 1), value(1.0)),
		material({
			color: value(0.5, 0.5, 0.5)
		})),
	entity(
		sierpinski(4, scale(value(1.4), unitSphere())),
		material({
			color: value(0.9, 0.5, 0.5),
			smoothness: value(0.99)
		}))
]);

createViewer(document.body, scene);


