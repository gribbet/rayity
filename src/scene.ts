import {Entity} from "./entity";
import {Camera, mouseCamera} from "./camera";

export type Scene = {
	entities: Entity[];
	camera: Camera;
}

export function scene(values?: {
						  entities?: Entity[],
						  camera?: Camera
					  }) {
	values = values || {};
	return {
		entities: values.entities || [],
		camera: values.camera || mouseCamera()
	};
}