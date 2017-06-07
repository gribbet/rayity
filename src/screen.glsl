precision highp float;

varying vec2 uv;
uniform sampler2D texture;

void main() {
	vec4 result = texture2D(texture, uv * 0.5 - 0.5);
	gl_FragColor = vec4(pow(result.xyz / result.w, vec3(1.0 / 2.2)), 1.0);
}