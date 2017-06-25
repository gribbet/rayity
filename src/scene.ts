import {Model} from "./model";
import {Camera, mouseCamera} from "./camera";

export type Scene = {
	models: Model[];
	camera: Camera;
}

export function scene(values?: {
						  models?: Model[],
						  camera?: Camera
					  }) {
	return Object.assign({
		models: [],
		camera: mouseCamera()
	}, values || {});
}