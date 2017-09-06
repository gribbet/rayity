/** 
 * Module for creating a [[Model]]
 */

/** Imports */
import { Material, material } from './material';
import { Shape, sphere } from './shape';

/** An object in a [[Scene]] */
export interface Model {
	/** Unique model identifier */
	readonly id: number;
	/** Model's [[Shape]] */
	readonly shape: Shape;
	/** Model's [[Material]] */
	readonly material: Material;
}

export interface ModelOptions {
	/** Model's [[Shape]] */
	shape?: Shape;
	/** Model's [[Material]] */
	material?: Material;
}

let id = 1;

/** Create a [[Model]] */
export function model(values?: ModelOptions): Model {
	return Object.assign({
		id: id++,
		shape: sphere(),
		material: material({})
	}, values || {});
}