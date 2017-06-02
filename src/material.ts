import {Color, color} from "./color";

export type Material = {
	transmittance: number,
	smoothness: number,
	refraction: number,
	color: Color,
	emissivity: Color
}


export function material(values: {
							 transmittance?: number,
							 smoothness?: number,
							 refraction?: number,
							 color?: Color,
							 emissivity?: Color
						 }) {
	return {
		transmittance: values.transmittance || 0.0,
		smoothness: values.smoothness || 0.0,
		refraction: values.refraction || 1.0,
		color: values.color || color(1, 1, 1),
		emissivity: values.emissivity || color(0, 0, 0)
	};
}
