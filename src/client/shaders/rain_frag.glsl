#include <packing>

uniform float uLightFactor;
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
    
  float lightIntensityOnRaindrop = uLightFactor;

  float distanceFromPointLight0 = distance(raindropPosition, uPointLightPositions[0]);  
  float distanceFromPointLight1 = distance(raindropPosition, uPointLightPositions[1]);

  // float intensity0 = 1.0 / (1.0 + distanceFromPointLight0); 
  // float intensity1 = 1.0 / (1.0 + distanceFromPointLight1);
  float intensity0 = exp(-distanceFromPointLight0 * 0.2) / 2.0;   // lower intensity as further away from point light sources
  float intensity1 = exp(-distanceFromPointLight1 * 0.2) / 2.0;
        
  float combinedIntensity = (intensity0 + intensity1);  // This part is to make sure that raindrops further away from the bulb has loweri ntensity.

  float alpha = diffuseColor.a;
  if (raindropPosition.y < near + readDepth()) {
    alpha = 0.0;
  }
    
  vec4 finalColor = vec4(diffuseColor.rgb * lightIntensityOnRaindrop * combinedIntensity, alpha);
  gl_FragColor = finalColor;
}