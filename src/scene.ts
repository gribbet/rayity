import { Model } from "./model";
import { Camera, mouseCamera } from "./camera";
import { Material, material } from "./material";
import { value } from "./expression";

export type Scene = {
	models: Model[];
	camera: Camera;
	air: Material;
}

export function scene(values?: {
	models?: Model[],
	camera?: Camera,
	air?: Material
}) {
	return Object.assign({
		models: [],
		camera: mouseCamera(),
		air: material({
			refraction: value(1)
		})
	}, values || {});
}