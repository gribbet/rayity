/**
 * Module for creating a [[Scene]]
 */

/** Imports */
import { Camera, orbit } from './camera';
import { value } from './expression';
import { Material, material } from './material';
import { Model } from './model';

export interface Scene {
	/** [[Model]]s in the scene */
	readonly models: Model[];
	/** Scene [[Camera]] */
	readonly camera: Camera;
	/** Scene air [[Material]] */
	readonly air: Material;
}

export interface SceneOptions {
	/** 
	 * [[Model]]s in the scene 
	 * 
	 * Default: []
	 */
	models?: Model[];
	/** 
	 * Scene [[Camera]] 
	 * 
	 * Default: [[orbit]]()
	 */
	camera?: Camera;
	/** 
	 * Scene air [[Material]] 
	 * 
	 * Default: [[material]]({ color: value(1, 1, 1) })
	 */
	air?: Material;
}

/** Create a [[Scene]] */
export function scene(values?: SceneOptions): Scene {
	return Object.assign({
		models: [],
		camera: orbit(),
		air: material({
			color: value(1, 1, 1)
		})
	}, values || {});
}