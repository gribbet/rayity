import { Expression, value } from "./expression";

export type Material = {
	transmittance: Expression,
	smoothness: Expression,
	refraction: Expression,
	scatter: Expression,
	color: Expression,
	emissivity: Expression
}

export function material(values?: {
	transmittance?: Expression,
	smoothness?: Expression,
	refraction?: Expression,
	scatter?: Expression,
	color?: Expression,
	emissivity?: Expression
}) {
	return Object.assign({
		transmittance: value(0),
		smoothness: value(0),
		refraction: value(1),
		scatter: value(1e20), 
		color: value(1, 1, 1),
		emissivity: value(0, 0, 0)
	}, values || {});
}

export function spotlight(options: {
	direction?: Expression,
	color?: Expression,
	spread?: Expression,
	ambient?: Expression,
}): Material {
	options = options || {};
	let direction = options.direction || value(0, 1, 0);
	let color = options.color || value(1, 1, 1);
	let spread = options.spread || value(1);
	let ambient = options.ambient || value(0);
	return material({
		color: value(0),
		emissivity: `${color} / ${spread}.x * pow(dot(normalize(p), normalize(${direction})) * 0.5 + 0.5, 1.0 / ${spread}.x - 1.0) + ${ambient}`
	});
}
