/**
 * Module for creating a [[Camera]]
 */

/** Imports */
import { Expression, expression, value } from './expression';

export interface Camera {
	/** Location of the camera */
	readonly eye: Expression;
	/** Location of the target */
	readonly target: Expression;
	/** Up direction vector */
	readonly up: Expression;
	/** Field of view angle in radians */
	readonly fieldOfView: Expression;
	/** Aperture size for depth of field */
	readonly aperture: Expression;
	/** Focal distance relative to target distance */
	readonly focalFactor: Expression;
}

export interface CameraOptions {
	/** 
	 * Location of the camera
	 * 
	 * Default: (0, 0, -1) 
	 * */
	eye?: Expression;
	/** 
	 * Location of the target
	 * 
	 * Default: (0, 0, 0)
	 */
	target?: Expression;
	/** 
	 * Up direction vector 
	 * 
	 * Default: (0, 1, 0)
	*/
	up?: Expression;
	/** 
	 * Field of view angle in radians
	 * 
	 * Default: 90 degrees 
	 */
	fieldOfView?: Expression;
	/** 
	 * Aperture size for depth of field 
	 * 
	 * Default: 0
	*/
	aperture?: Expression;
	/** 
	 * Focal distance relative to target distance 
	 * 
	 * Default: 1
	*/
	focalFactor?: Expression;
}

/** Create a [[Camera]] */
export function camera(values?: CameraOptions): Camera {
	values = values || {};
	return {
		eye: values.eye || value(0, 0, -1),
		target: values.target || value(0, 0, 0),
		up: values.up || value(0, 1, 0),
		fieldOfView: values.fieldOfView || value(90 / 180.0 * Math.PI),
		aperture: values.aperture || value(0.0),
		focalFactor: values.focalFactor || value(1.0)
	};
}

export interface OrbitOptions {
	/** 
	 * Location of the target
	 * 
	 * Default: (0, 0, 0)
	 */
	target?: Expression,
	/** 
	 * Orbit radius 
	 * 
	 * Default: 1
	*/
	radius?: Expression,
	/** 
	 * Up direction vector 
	 * 
	 * Default: (0, 1, 0)
	*/
	up?: Expression,
	/** 
	 * Offset in spherical coordinates 
	 * 
	 * Default: (0, 0)
	*/
	offset?: Expression,
	/** 
	 * Field of view angle in radians
	 * 
	 * Default: 90 degrees 
	 */
	fieldOfView?: Expression,
	/** 
	 * Aperture size for depth of field 
	 * 
	 * Default: 0
	*/
	aperture?: Expression,
	/** 
	 * Focal distance relative to target distance 
	 * 
	 * Default: 1
	*/
	focalFactor?: Expression
}

/** Create an orbiting [[Camera]] controlled by the mouse */
export function orbit(values?: OrbitOptions): Camera {
	values = values || {};
	values.target = values.target || value(0, 0, 0);
	values.offset = values.offset || value(0, 0);
	values.radius = values.radius || value(1);
	return camera({
		target: values.target,
		eye: expression(
			`${values.target} + ${values.radius}.x * spherical((mouse + ${values.offset}.xy) * vec2(PI, 0.5 * PI) + vec2(0.5 * PI))`),
		up: values.up,
		fieldOfView: values.fieldOfView,
		aperture: values.aperture,
		focalFactor: values.focalFactor
	});
}