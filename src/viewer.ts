import {Scene} from "./scene";
import {createRenderer} from "./renderer";

export function createViewer(
	element: HTMLElement,
	scene: Scene,
	options_?: {
		width?: number,
		height?: number,
		epsilon?: number,
		steps?: number,
		bounces?: number
	}) {

	const options = Object.assign({
		width: 512,
		height: 512,
	}, options_ || {});

	const canvas = document.createElement("canvas");
	canvas.width = options.width;
	canvas.height = options.height;
	element.appendChild(canvas);

	const gl = canvas.getContext("webgl", {
		preserveDrawingBuffer: false
	});
	if (gl === null)
		return null;

	const variables = {
		time: 0,
		clicked: false,
		mouse: {x: 0.0, y: 0.0}
	};

	const renderer = createRenderer(gl, scene, options, variables);

	canvas.addEventListener("mousedown", () => variables.clicked = true);
	document.addEventListener("mouseup", () => variables.clicked = false);

	canvas.addEventListener("mousemove", event => {
		if (variables.clicked) {
			variables.mouse.x += event.movementX / canvas.width;
			variables.mouse.y += -event.movementY / canvas.width;
		}
	});

	let start = 0;

	function loop(time: number) {
		if (!start) start = time;
		variables.time = (time - start) / 1000.0;

		renderer.render();

		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}