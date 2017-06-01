import {DistanceFunction} from "./DistanceFunction";
import {Material} from "./Material";

let id = 1;

export class Shape {
	readonly id: string = `${id++}`;

	constructor(public f: DistanceFunction,
				public material: Material = new Material()) {
	}
}
