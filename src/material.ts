import {Expression, value} from "./expression";

export type Material = {
	transmittance: Expression,
	smoothness: Expression,
	refraction: Expression,
	color: Expression,
	emissivity: Expression
}


export function material(values: {
							 transmittance?: Expression,
							 smoothness?: Expression,
							 refraction?: Expression,
							 color?: Expression,
							 emissivity?: Expression
						 }) {
	return {
		transmittance: values.transmittance || value(0.0),
		smoothness: values.smoothness || value(0.0),
		refraction: values.refraction || value(1.0),
		color: values.color || value(1, 1, 1),
		emissivity: values.emissivity || value(0, 0, 0)
	};
}
