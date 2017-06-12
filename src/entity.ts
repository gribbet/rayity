import {Material} from "./material";
import {Shape} from "./shape";

export type Entity = {
	id: number,
	shape: Shape,
	material: Material
}

let lastId = 1;
export function entity(shape: Shape, material: Material) {
	return {
		id: lastId++,
		shape: shape,
		material: material
	};
}