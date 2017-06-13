import {Entity} from "./entity";

export type Scene = {
	entities: Entity[]
}

export function scene(entities: Entity[]) {
	return {
		entities: entities
	};
}