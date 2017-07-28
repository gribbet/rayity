import { Camera, orbit } from './camera';
import { value } from './expression';
import { Material, material } from './material';
import { Model } from './model';

export type Scene = {
	readonly models: Model[];
	readonly camera: Camera;
	readonly air: Material;
}

export function scene(values?: {
	models?: Model[],
	camera?: Camera,
	air?: Material
}): Scene {
	return Object.assign({
		models: [],
		camera: orbit(),
		air: material({
			refraction: value(1)
		})
	}, values || {});
}