import {Expression, value} from "./expression";

export type Camera = {
	eye: Expression,
	target: Expression,
	up: Expression,
	fieldOfView: Expression,
	aperture: Expression
}

export function camera(values?: {
						   eye?: Expression,
						   target?: Expression,
						   up?: Expression,
						   fieldOfView?: Expression,
						   aperture?: Expression
					   }): Camera {
	values = values || {};
	return {
		eye: values.eye || value(0, 0, -1),
		target: values.target || value(0, 0, 0),
		up: values.up || value(0, 1, 0),
		fieldOfView: values.fieldOfView || value(120 / 180.0 * Math.PI),
		aperture: values.aperture || value(0.1)
	};
}

export function mouseCamera(values?: {
								target?: Expression,
								distance?: Expression,
								focalDistance?: Expression,
								aperture?: Expression
							}): Camera {
	values = values || {};
	values.target = values.target || value(0, 0, 0);
	return camera({
		target: values.target,
		eye: `${values.target} + ${values.distance || value(1)}.x * spherical(mouse * vec2(PI, 0.5 * PI) + vec2(0, 0.5 * PI))`
	});
}