import {createViewer} from "./src/viewer";
import {material} from "./src/material";
import {createScene} from "./src/scene";
import {mandelbulb, scale, translate, unitSphere} from "./src/shape";
import {value} from "./src/expression";
import {entity} from "./src/entity";

const scene = createScene([
		entity(
			scale(value(1000), unitSphere()),
			material({
				color: value(0, 0, 0),
				emissivity: value(1, 1, 1)
			})),
		entity(
			translate(value(-1, 0, 0), mandelbulb()),
			material({
				color: value(0.8, 0.8, 0.99),
				smoothness: value(1.0),
				transmittance: value(1.0)
			}))
	])
;

createViewer(document.body, scene);


