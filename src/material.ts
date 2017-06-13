import {Expression, value} from "./expression";

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
		refraciton: value(1),
		scatter: value(1e10),
		color: value(1, 1, 1),
		emissivity: value(0, 0, 0)
	}, values || {});
}
