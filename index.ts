import {Value, VectorValue} from "./src/Expression";
import {Shape} from "./src/Shape";
import {Scene} from "./src/Scene";
import {Material} from "./src/Material";
import {Color} from "./src/Color";
import {Plane, Repeat, RotateY, Scale, Translate, TwistZ, UnitBox, UnitSphere, WrapX} from "./src/DistanceFunction";
import {Vector} from "./src/Vector";
import {Renderer} from "./src/Renderer";

let wallMaterial = new Material()
	.withColor(new Color(0.8, 0.8, 0.8))
	.withSmoothness(0.0);
let scene = new Scene([
		new Shape(
			new Plane(new VectorValue(new Vector(-1, 0, 0)), new Value(20.0)),
			wallMaterial),
		new Shape(
			new Plane(new VectorValue(new Vector(1, 0, 0)), new Value(20.0)),
			wallMaterial),
		new Shape(
			new Plane(new VectorValue(new Vector(0, 1, 0)), new Value(20.0)),
			wallMaterial),
		new Shape(
			new Plane(new VectorValue(new Vector(0, -1, 0)), new Value(20.0)),
			wallMaterial),
		new Shape(
			new Plane(new VectorValue(new Vector(0, 0, 1)), new Value(0.0)),
			wallMaterial),
		new Shape(
			new Plane(new VectorValue(new Vector(0, 0, -1)), new Value(20.0)),
			wallMaterial),
		new Shape(
			new Translate(
				new Scale(
					new UnitSphere(),
					new Value(5)),
				new Vector(10, 5, 10)),
			new Material()
				.withTransmittance(0.0)
				.withSmoothness(1.0)
				.withColor(new Color(0, 0, 0))
				.withEmissivity(new Color(8, 8, 8))),
		new Shape(
			new Translate(
				new WrapX(
					new Translate(
						new RotateY(
							new Scale(
								new Repeat(
									new TwistZ(
										new Scale(
											new UnitBox(),
											new VectorValue(new Vector(0.1, 0.1, 1000)))),
									new VectorValue(
										new Vector(0.6, 0, 0))),
								new VectorValue(new Vector(1, 1, 0.3))),
							new Value(0.5)),
						new Vector(0, 1, 0))),
				new Vector(0, 0, 2)),
			new Material()
				.withTransmittance(0.0)
				.withSmoothness(0.5)
				.withColor(new Color(0.7, 0.7, 0.8)))
	])
;

const width = 512;
const height = 512;


const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl", {
	preserveDrawingBuffer: false
});

const renderer = new Renderer(gl, scene);

renderer.mouse = {x: 0.25, y: -0.5};

canvas.addEventListener("mousedown", () => renderer.clicked = true);
document.addEventListener("mouseup", () => renderer.clicked = false);

canvas.addEventListener("mousemove", event => {
	if (renderer.clicked) {
		renderer.mouse.x += event.movementX / canvas.width;
		renderer.mouse.y += -event.movementY / canvas.width;
	}
});

function loop() {
	renderer.render();

	requestAnimationFrame(loop);
}

loop();
