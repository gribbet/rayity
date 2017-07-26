import { Material, material } from './material';
import { Shape, unitSphere } from './shape';

export type Model = {
	id: number,
	shape: Shape,
	material: Material
}

let id = 1;

export function model(values?: {
	shape?: Shape,
	material?: Material
}) {
	return Object.assign({
		id: id++,
		shape: unitSphere(),
		material: material({})
	}, values || {});
}