#include <packing>

uniform float uPointLightFactor;
uniform float uSunLightFactor;


uniform vec3 uPointLightPositions[NUM_POINT_LIGHTS];
varying vec3 raindropPosition;
varying vec2 depthUV;
uniform sampler2D depth;
uniform float near;
uniform float far;

float readDepth() {
  float z = texture2D(depth, depthUV).x;
  return orthographicDepthToViewZ(z, 1.0, near - far + 1.0);
}
    
void main() {
  vec4 diffuseColor = vec4(1.0);
    
  float pointLightIntensityOnRaindrop = uPointLightFactor;

  float distanceFromPointLight0 = distance(raindropPosition, uPointLightPositions[0]);  
  float distanceFromPointLight1 = distance(raindropPosition, uPointLightPositions[1]);

  // float intensity0 = 1.0 / (1.0 + distanceFromPointLight0); 
  // float intensity1 = 1.0 / (1.0 + distanceFromPointLight1);
  float intensity0 = exp(-distanceFromPointLight0 * 0.2) / 2.0;   // lower intensity as further away from point light sources
  float intensity1 = exp(-distanceFromPointLight1 * 0.2) / 2.0;
  float combinedIntensity = (intensity0 + intensity1);  // This part is to make sure that raindrops further away from the bulb has lower intensity.
  float finalPointLightIntensityOnRaindrop = pointLightIntensityOnRaindrop * combinedIntensity;

  if (raindropPosition.y < near + readDepth()) {
    discard;
  }

  // rain frag take account of both sunlight and lamp pointlights
  vec4 finalColor = vec4(diffuseColor.rgb * (finalPointLightIntensityOnRaindrop + uSunLightFactor), diffuseColor.a);
  gl_FragColor = finalColor;
}
