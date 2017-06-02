import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {color} from "./src/color";
import {createScene} from "./src/scene";
import {plane, repeat, rotateY, scale, translate, union, unitCylinder, wrapX} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const wallMaterial = material({
	color: color(0.5, 0.5, 0.5)
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
			emissivity: color(1, 1, 1)
		})),
	entity(
		plane(value(0, 0, 1), value(1.2)),
		wallMaterial),
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
			smoothness: 0.9,
			color: color(0.6	, 0.5, 0.5)
		}))
]);

createViewer(document.body, scene);


