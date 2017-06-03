import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {plane, repeat, rotateY, scale, translate, union, unitCylinder, wrapX} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const wallMaterial = material({
	color: value(0.5, 0.5, 0.5)
});

const scene = createScene([
	entity(
		plane(value(-1, 0, 0), value(100)),
		wallMaterial),
	entity(
		plane(value(1, 0, 0), value(100)),
		wallMaterial),
	entity(
		plane(value(0, -1, 0), value(100)),
		wallMaterial),
	entity(
		plane(value(0, 1, 0), value(100)),
		wallMaterial),
	entity(
		plane(value(0, 0, -1), value(10)),
		material({
			emissivity: value(1, 1, 1)
		})),
	entity(
		plane(value(0, 0, 1), value(1.2)),
		material({
			color: `vec3(0.7, 0.7, 0.7) * mod(floor(0.5 * sin(p.x) + 1.0) + floor(0.5 * sin(p.y) + 1.0), 2.0) + vec3(0.2, 0.2, 0.2)`
		})),
	entity(
		translate(value(0, 3, 0),
			repeat(value(0, 4, 0),
				union(
					wrapX(
						rotateY(value(-3.14159 / 4),
							translate(value(0, 1, 0),
								repeat(value(2.2, 0, 0),
									scale(value(0.2), unitCylinder()))))),
					wrapX(
						rotateY(value(3.14159 / 4),
							translate(value(0, 1, 0),
								repeat(value(2.2, 0, 0),
									scale(value(0.2), unitCylinder())))))))),
		material({
			transmittance: value(0.95),
			refraction: value(1.4),
			smoothness: value(0.5),
			color: value(0.9, 0.8, 0.8)
		}))
]);

createViewer(document.body, scene);


