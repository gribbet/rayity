import {Color} from "./Color";

export class Material {
	constructor(public transmittance: number = 0.0,
				public smoothness: number = 0.0,
				public refraction: number = 1.0,
				public color: Color = new Color(1, 1, 1),
				public emissivity: Color = new Color(0, 0, 0)) {
	}

	withTransmittance(transmittance: number): Material {
		this.transmittance = transmittance;
		return this;
	}

	withSmoothness(smoothness: number): Material {
		this.smoothness = smoothness;
		return this;
	}

	withRefraction(refraction: number): Material {
		this.refraction = refraction;
		return this;
	}

	withColor(color: Color): Material {
		let copy = Object.create(this);
		copy.color = color;
		return copy;
	}

	withEmissivity(emissivity: Color): Material {
		let copy = Object.create(this);
		copy.emissivity = emissivity;
		return copy;
	}
}