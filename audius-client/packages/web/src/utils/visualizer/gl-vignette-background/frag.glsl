#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;

#pragma glslify: random = require(glsl-random)

uniform float aspect;
uniform vec2 scale; 
uniform vec2 offset;
uniform bool coloredNoise;

uniform vec2 smoothing;
uniform float noiseAlpha;

uniform vec3 color1;
uniform vec3 color2;

vec3 BlendOverlay(vec3 base, vec3 blend) {
	return vec3(
		base.r < 0.5 ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
		base.g < 0.5 ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
		base.b < 0.5 ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
	);
}

//TODO: textures, alpha ? 

void main() {	
	vec2 pos = vUv;
	pos -= 0.5;

	pos.x *= aspect;
	pos /= scale;
	pos -= offset;

	float dist = length(pos);
	dist = smoothstep(smoothing.x, smoothing.y, 1.-dist);

	vec4 color = vec4(1.0);
	color.rgb = mix(color2, color1, dist);

	if (noiseAlpha > 0.0) {
		vec3 noise = coloredNoise ? vec3(random(vUv * 1.5), random(vUv * 2.5), random(vUv)) : vec3(random(vUv));
		color.rgb = mix(color.rgb, BlendOverlay(color.rgb, noise), noiseAlpha);
	}
	gl_FragColor = color;
}