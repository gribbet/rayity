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
		scatter: value(1e10),
		color: value(1, 1, 1),
		emissivity: value(0, 0, 0)
	}, values || {});
}

export function spotlightMaterial(options: {
	direction?: Expression,
	color?: Expression,
	spread?: Expression
}): Material {
	options = options || {};
	let direction = options.direction || value(0, 1, 0);
	let color = options.color || value(1, 1, 1);
	let spread = options.spread || value(1);
	return material({
		transmittance: value(1),
		emissivity: `${color} / ${spread}.x * pow(dot(normalize(p), normalize(${direction})), 1.0 / ${spread}.x - 1.0)`
	});
}
