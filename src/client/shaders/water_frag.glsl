#include <packing>

uniform vec3 waterColor;
uniform sampler2D opaqueTexture;
uniform sampler2D depthTexture;
uniform sampler2D reflectedTexture;

varying vec3 norm;
varying vec3 view;
varying vec2 refractUV;
varying vec2 screenUV;
varying float waterDepth;

const float near = 0.1;
const float far = 1000.0;

float readDepth() {
  float depth = texture2D(depthTexture, refractUV).x;
  float z = perspectiveDepthToViewZ(depth, near, far);
  return viewZToOrthographicDepth(z, near, far);
}

void main() {
  float fresnel = mix(0.1, 0.95, pow(1.0 - dot(norm, -view), 3.0));
  
  vec2 uv = refractUV;
  if (viewZToOrthographicDepth(waterDepth, near, far) > readDepth()) { // * if we are sampling thing above water
    uv = screenUV; // * use the original uv instead of refracted uv
  }

  vec3 refractColor = texture2D(opaqueTexture, uv).rgb * waterColor;
  vec3 reflectColor = texture2D(reflectedTexture, vec2(screenUV.s, 1.0 - screenUV.t)).rgb;
  gl_FragColor = vec4(mix(refractColor, reflectColor, fresnel), 1.0);
}
