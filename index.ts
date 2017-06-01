import {Value, VectorValue} from "./src/Expression";
import {Shape} from "./src/Shape";
import {Scene} from "./src/Scene";
import {Material} from "./src/Material";
import {Color} from "./src/Color";
import {
	Plane,
	Scale,
	Subtraction,
	Translate,
	TwistZ,
	Union,
	UnitBox,
	UnitCylinder,
	UnitSphere
} from "./src/DistanceFunction";
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
			.withEmissivity(new Color(12, 12, 12))),
	new Shape(
		new Union(
			new Translate(
				new Scale(new TwistZ(new UnitBox()), new Value(1.0)),
				new Vector(0, 0, 1.0)),
			new Subtraction(
				new Subtraction(
					new Scale(
						new UnitCylinder(),
						new Value(3)),
					new Scale(
						new UnitCylinder(),
						new Value(2.5))),
				new Plane(new VectorValue(new Vector(0, 0, -1)), new Value(2.0)))),
		new Material()
			.withTransmittance(0.8)
			.withSmoothness(0.5)
			.withRefraction(1.4)
			.withColor(new Color(0.95, 0.95	, 1.0)))
]);

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
