import { Material, material } from './material';
import { Shape, sphere } from './shape';

export type Model = {
	readonly id: number,
	readonly shape: Shape,
	readonly material: Material
}

let id = 1;

export function model(values?: {
	shape?: Shape,
	material?: Material
}): Model {
	return Object.assign({
		id: id++,
		shape: sphere(),
		material: material({})
	}, values || {});
}