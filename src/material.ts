/**
 * Module for creating a [[Material]]
 */

/** Imports */
import { Expression, expression, value } from './expression';

export interface Material {
	/** Material transmittance. 0 to 1 */
	readonly transmittance: Expression;
	/** Material smoothness. 0 to 1*/
	readonly smoothness: Expression;
	/** Material index of refraction */
	readonly refraction: Expression;
	/** Material's average scatter distance */
	readonly scatter: Expression;
	/** Material color */
	readonly color: Expression;
	/** Emission color */
	readonly emissivity: Expression;
}

export interface MaterialOptions {
	/** 
	 * Material transmittance. 0 to 1
	 * 
	 * Default: 0
	 */
	transmittance?: Expression;
	/** 
	 * Material smoothness. 0 to 1
	 * 
	 * Default: 0
	 */
	smoothness?: Expression;
	/** 
	 * Material index of refraction 
	 * 
	 * Default: 1
	 */
	refraction?: Expression;
	/** 
	 * Material's average scatter distance
	 * 
	 * Default: 1e10
	 */
	scatter?: Expression;
	/** 
	 * Material color 
	 * 
	 * Default: (1, 1, 1)
	 */
	color?: Expression;
	/** 
	 * Emission color 
	 * 
	 * Default: (0, 0, 0) 
	 */
	emissivity?: Expression;
}

/** Create a [[Material]] */
export function material(values?: MaterialOptions): Material {
	return Object.assign({
		transmittance: value(0),
		smoothness: value(0),
		refraction: value(1),
		scatter: value(1e10),
		color: value(1, 1, 1),
		emissivity: value(0, 0, 0)
	}, values || {});
}

export interface SpotlightOptions {
	/**
	 * Direction of light
	 * 
	 * Default: (0, 1, 0)
	 */
	direction?: Expression;
	/**
	 * Light color
	 * 
	 * Default: (1, 1, 1)
	 */
	color?: Expression;
	/**
	 * Spread factor that specifies light hardness. 0 for hard light (sharp shadows), 1 for ambient light only
	 * 
	 * Default: 0.5
	 */
	spread?: Expression;
	/**
	 * Ambiebnt color
	 * 
	 * Default: (0, 0, 0)
	 */
	ambient?: Expression;
}

/** Create a spotlight [[Material]] */
export function spotlight(options: {
	direction?: Expression,
	color?: Expression,
	spread?: Expression,
	ambient?: Expression,
}): Material {
	options = options || {};
	let direction = options.direction || value(0, 1, 0);
	let color = options.color || value(1, 1, 1);
	let spread = options.spread || value(0.5);
	let ambient = options.ambient || value(0);
	return material({
		color: value(0),
		emissivity: expression(
			`${color} / ${spread}.x * pow(dot(normalize(p), normalize(${direction})) * 0.5 + 0.5, 1.0 / ${spread}.x - 1.0) + ${ambient}`)
	});
}
