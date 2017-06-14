import {Model} from "./model";
import {Camera, mouseCamera} from "./camera";

export type Scene = {
	entities: Model[];
	camera: Camera;
}

export function scene(values?: {
						  entities?: Model[],
						  camera?: Camera
					  }) {
	return Object.assign({
		entities: [],
		camera: mouseCamera()
	}, values || {});
}