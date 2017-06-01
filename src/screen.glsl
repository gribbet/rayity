precision highp float;

varying vec2 uv;
uniform sampler2D texture;

void main() {
	vec4 result = texture2D(texture, uv * 0.5 - 0.5);
	gl_FragColor = vec4(result.xyz / result.w, 1.0);
}