attribute vec4 position;
attribute vec2 uv;
uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

varying vec2 vUv;

void main() {
	gl_Position = projection * view * model * position;
	vUv = uv;
}