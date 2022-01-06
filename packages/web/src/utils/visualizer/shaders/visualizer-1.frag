precision highp float;

uniform vec3 color;
uniform float opacity;
varying float vAngle;

// Colors
uniform float r1;
uniform float g1;
uniform float b1;

uniform float r2;
uniform float g2;
uniform float b2;

uniform float r3;
uniform float g3;
uniform float b3;

#define PI 3.14

void main() {
  vec3 tCol = color;

  float interp = sin(vAngle * 1.0);
  float finalR;
  float finalG;
  float finalB;
  if (interp > 0.0) {
    finalR = mix(r1, r2, interp);
    finalG = mix(g1, g2, interp);
    finalB = mix(b1, b2, interp);
  } else {
    finalR = mix(r1, r3, -1.0 * interp);
    finalG = mix(g1, g3, -1.0 * interp);
    finalB = mix(b1, b3, -1.0 * interp);
  }

  tCol = vec3(finalR, finalG, finalB);
  
  gl_FragColor = vec4(tCol, opacity);
  gl_FragColor.rgb *= gl_FragColor.a;
}