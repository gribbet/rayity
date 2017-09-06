import { Material, material } from './material';
import { Shape, sphere } from './shape';

/** An object in a [[Scene]] */
export interface Model {
	/** Unique model identified */
	readonly id: number;
	/** Object's [[Shape]] */
	readonly shape: Shape;
	/** Object's [[Material]] */
	readonly material: Material;
}

export interface ModelOptions {
	/** Object's [[Shape]] */
	shape?: Shape;
	/** Object's [[Material]] */
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