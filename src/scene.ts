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
	return Object.assign({
		entities: [],
		camera: mouseCamera()
	}, values || {});
}