import {Scene} from "./scene";
import {createRenderer} from "./renderer";

const width = 512;
const height = 512;

export function createViewer(
	element: HTMLElement,
	scene: Scene) {

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	element.appendChild(canvas);

	const gl = canvas.getContext("webgl", {
		preserveDrawingBuffer: false
	});

	const settings = {
		time: 0,
		clicked: false,
		mouse: {x: 0.0, y: 0.0}
	};

	const renderer = createRenderer(gl, scene, { width: width, height: height}, settings);

	canvas.addEventListener("mousedown", () => settings.clicked = true);
	document.addEventListener("mouseup", () => settings.clicked = false);

	canvas.addEventListener("mousemove", event => {
		if (settings.clicked) {
			settings.mouse.x += event.movementX / canvas.width;
			settings.mouse.y += -event.movementY / canvas.width;
		}
	});

	let start = 0;
	function loop(time: number) {
		if (!start) start = time;
		settings.time = (time - start) / 1000.0;

		renderer.render();

		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}