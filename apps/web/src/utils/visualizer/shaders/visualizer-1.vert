attribute vec3 position;
attribute float direction; 
attribute vec3 next;
attribute vec3 previous;

uniform sampler2D audioTexture;
uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;
uniform float aspect;
uniform float radius;
uniform float index;

uniform float thickness;
uniform float iGlobalTime;
uniform int miter;

varying float vAngle;
varying vec2 uvCoords;

#define HAS_VERTEX_SAMPLER
#define PI 3.14

#pragma glslify: analyse = require('gl-audio-analyser')
#pragma glslify: noise4d = require('glsl-noise/simplex/4d')
#pragma glslify: noise3d = require('glsl-noise/simplex/3d')

vec4 line3D (vec3 positionOffset, float computedThickness) {
  vec2 aspectVec = vec2(aspect, 1.0);
  mat4 projViewModel = projection * view * model;
  vec4 previousProjected = projViewModel * vec4(previous + positionOffset, 1.0);
  vec4 currentProjected = projViewModel * vec4(position + positionOffset, 1.0);
  vec4 nextProjected = projViewModel * vec4(next + positionOffset, 1.0);

  //get 2D screen space with W divide and aspect correction
  vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;
  vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;
  vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;

  float len = computedThickness;
  float orientation = direction;

  //starting point uses (next - current)
  vec2 dir = vec2(0.0);
  if (currentScreen == previousScreen) {
    dir = normalize(nextScreen - currentScreen);
  } 
  //ending point uses (current - previous)
  else if (currentScreen == nextScreen) {
    dir = normalize(currentScreen - previousScreen);
  }
  //somewhere in middle, needs a join
  else {
    //get directions from (C - B) and (B - A)
    vec2 dirA = normalize((currentScreen - previousScreen));
    if (miter == 1) {
      vec2 dirB = normalize((nextScreen - currentScreen));
      //now compute the miter join normal and length
      vec2 tangent = normalize(dirA + dirB);
      vec2 perp = vec2(-dirA.y, dirA.x);
      vec2 miter = vec2(-tangent.y, tangent.x);
      dir = tangent;
      len = computedThickness / dot(miter, perp);
    } else {
      dir = dirA;
    }
  }
  vec2 normal = vec2(-dir.y, dir.x);
  normal *= len/2.0;
  normal.x /= aspect;

  vec4 offset = vec4(normal * orientation, 0.0, 1.0);
  return currentProjected + offset;
}

float turb (float angle, float alpha, float scale, float offset) {
  return alpha * noise3d(vec3(position.x * scale, angle, offset));  
} 

void main() {
  #ifdef HAS_VERTEX_SAMPLER
  float frequencies = analyse(audioTexture, position.x * 0.5 + 0.5);
  #endif
  
  float pinch = smoothstep(0.0, 0.5, 1.0 - abs(position.x));
  float computedThickness = thickness;
  computedThickness *= pinch;
  
  vec3 offset = vec3(0.0);
  
  // we will wrap the lines around like a finger trap
  float angleOffset = index * PI; // separate each line a bit
  float twists = 0.5; // twisting factor
  float radialOffset = 2.0 * PI * position.x;
  
  #ifdef HAS_VERTEX_SAMPLER
  angleOffset *= mix(0.5, 1.5, frequencies);
  #endif
  
  float angle = radialOffset * twists + angleOffset;
  angle += iGlobalTime;
  
  
  float computedRadius = radius;
  #ifdef HAS_VERTEX_SAMPLER
  computedRadius += turb(angle, frequencies * 0.5, 1.0, iGlobalTime * 0.2);
  #endif
  computedRadius += turb(angle, 0.1, 6.0, iGlobalTime * 0.25);
  computedRadius += turb(angle, 0.1, 2.5, iGlobalTime * 0.5);
  computedRadius *= pinch;
  #ifdef HAS_VERTEX_SAMPLER
  computedRadius *= mix(0.65, 1.0, frequencies);
  #endif
  
  vAngle = angle;
  offset.y = cos(angle) * computedRadius;
  offset.z = sin(angle) * computedRadius;
  
  uvCoords = vec2(position.x * 0.5 + 0.5, sign(direction));
  gl_Position = line3D(offset, computedThickness);  
  gl_PointSize = 1.0;
}