import {Material} from "./material";
import {Shape} from "./shape";

export type Model = {
	id: number,
	shape: Shape,
	material: Material
}

let id = 1;

export function model(
	shape: Shape,
	material: Material) {

	return {
		id: id++,
		shape: shape,
		material: material
	};
}