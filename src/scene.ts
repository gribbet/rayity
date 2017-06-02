import {Entity} from "./entity";

export type Scene = {
	entities: Entity[]
}

export function createScene(entities: Entity[]) {
	return {
		entities: entities
	};
}