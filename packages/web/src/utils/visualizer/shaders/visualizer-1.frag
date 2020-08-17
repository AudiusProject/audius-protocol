precision highp float;

uniform sampler2D brushTexture;
uniform vec3 color;
uniform float opacity;
uniform bool useHue;
uniform float iGlobalTime;
varying float vAngle;
varying vec2 uvCoords;

#define PI 3.14
#pragma glslify: hsl2rgb = require('glsl-hsl2rgb')

void main() {
  vec3 tCol = color;
  if (useHue) {
    float sat = 0.7;
    float light = 0.6;
    
    float rainbow = sin(vAngle * 1.0) * 0.5 + 0.5;
    float hue = 0.0;
    hue += mix(0.5, 0.9, rainbow);
    tCol = hsl2rgb(vec3(hue, sat, light));
  }
  
  // vec2 vUv = vec2(uvCoords.x, 1.0 - abs(uvCoords.y));
  // vec4 brush = texture2D(brushTexture, vUv);
  
  gl_FragColor = vec4(tCol, opacity);
  gl_FragColor.rgb *= gl_FragColor.a;
}