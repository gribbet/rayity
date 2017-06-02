import {
	color,
	createRenderer,
	createScene,
	material,
	plane,
	scale,
	shape,
	translate,
	unitSphere,
	value
} from "./src/test";

const wallMaterial = material({
	color: color(0.8, 0.8, 0.8)
});

const scene = createScene([
	shape(
		plane(value(-1, 0, 0), value(10)),
		wallMaterial),
	shape(
		plane(value(1, 0, 0), value(10)),
		wallMaterial),
	shape(
		plane(value(0, -1, 0), value(10)),
		wallMaterial),
	shape(
		plane(value(0, 1, 0), value(10)),
		wallMaterial),
	shape(
		plane(value(0, 0, -1), value(10)),
		material({
			emissivity: color(1, 1, 1)
		})),
	shape(
		plane(value(0, 0, 1), value(10)),
		wallMaterial),
	shape(
		scale(value(2, 1, 1),
			translate(value(0, 0, 1),
				unitSphere())),
		material({
			transmittance: 0.9,
			smoothness: 0.8,
			refraction: 1.4,
			color: color(1, 0.8, 0.8)
		}))
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

const settings = {
	clicked: false,
	mouse: {x: 0.25, y: -0.5}
};

const renderer = createRenderer(gl, scene, settings);

canvas.addEventListener("mousedown", () => settings.clicked = true);
document.addEventListener("mouseup", () => settings.clicked = false);

canvas.addEventListener("mousemove", event => {
	if (settings.clicked) {
		settings.mouse.x += event.movementX / canvas.width;
		settings.mouse.y += -event.movementY / canvas.width;
	}
});

function loop() {
	renderer.render();

	requestAnimationFrame(loop);
}

loop();
