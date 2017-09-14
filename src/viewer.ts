/** 
 * Module for creating a Rayity viewer
 */

import { Options } from './options';
import { renderer } from './renderer';
import { Scene } from './scene';

/** A Rayity viewer to render a [[Scene]] to an [[HTMLElement] */
export interface Viewer {
	stop: () => void;
}

/** Create a [[Viewer]] */
export function viewer(
	element: HTMLElement,
	scene: Scene,
	options: Options): Viewer {

	const canvas = document.createElement("canvas");
	canvas.width = options.width;
	canvas.height = options.height;
	element.appendChild(canvas);

	const gl = canvas.getContext("webgl", {
		preserveDrawingBuffer: true
	});
	if (gl === null)
		throw "Could not create WebGL context";

	const variables = {
		time: 0,
		clicked: false,
		mouse: { x: 0.0, y: 0.0 }
	};

	const renderer_ = renderer(gl, scene, options, variables);

	canvas.addEventListener("click", event => {
		if (!event.altKey)
			return;
		const link = document.createElement("a");
		link.setAttribute("download", "render.png");
		canvas.toBlob(blob => {
			link.setAttribute("href", URL.createObjectURL(blob));
			link.click();
		});
	});

	canvas.addEventListener("mousedown", () => variables.clicked = true);
	document.addEventListener("mouseup", () => variables.clicked = false);

	canvas.addEventListener("mousemove", event => {
		if (variables.clicked) {
			variables.mouse.x += event.movementX / canvas.clientWidth;
			variables.mouse.y += -event.movementY / canvas.clientHeight;
		}
	});

	let start = 0;
	let running = true;

	function loop(time: number) {
		if (!start) start = time;
		variables.time = (time - start) / 1000.0;

		renderer_.render();

		if (running)
			requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);

	return {
		stop: () => {
			running = false;
			element.removeChild(canvas);
		}
	};
}