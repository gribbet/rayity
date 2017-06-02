import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {color} from "./src/color";
import {createScene} from "./src/scene";
import {blend, plane, translate, unitCylinder, unitSphere} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const wallMaterial = material({
	color: color(0.8, 0.8, 0.8)
});

const scene = createScene([
	entity(
		plane(value(-1, 0, 0), value(10)),
		wallMaterial),
	entity(
		plane(value(1, 0, 0), value(10)),
		wallMaterial),
	entity(
		plane(value(0, -1, 0), value(10)),
		wallMaterial),
	entity(
		plane(value(0, 1, 0), value(10)),
		wallMaterial),
	entity(
		plane(value(0, 0, -1), value(10)),
		material({
			emissivity: color(1, 1, 1)
		})),
	entity(
		plane(value(0, 0, 1), value(10)),
		wallMaterial),
	entity(
		blend(
			0.5,
			unitSphere(),
			translate(value(1, 0, 0), unitCylinder())),
		material({
			transmittance: 0.9,
			smoothness: 0.1,
			refraction: 1.4,
			color: color(1, 0.8, 0.8)
		}))
]);

createViewer(document.body, scene);


