import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {blend, plane, rotateY, scale, translate, twistZ, unitCylinder, unitSphere} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const scene = createScene([
	entity(
		plane(value(0, 0, 1), value(3.0)),
		material({
			color: `mod(floor(p.x) + floor(p.y), 2.0) * vec3(0.9) + vec3(0.1)`,
			smoothness: value(0.5)
		})),
	entity(
		scale(value(100), unitSphere()),
		material({
			color: value(0, 0, 0),
			emissivity: value(1.2, 1.2, 1.2)
		})),
	entity(
		rotateY(value(Math.PI / 2),
			blend(8.0,
				unitSphere(),
				scale(value(0.1),
					twistZ(value(Math.PI / 8),
						translate(value(4, 0, 0), unitCylinder()))))),
		material({
			color: value(0.9, 0.5, 0.5),
			smoothness: value(0.95),
		})),
]);

createViewer(document.body, scene);


