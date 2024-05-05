#include <packing>

uniform vec3 water_color;
uniform sampler2D opaque_texture;
uniform sampler2D depth_texture;
uniform sampler2D reflected_texture;
uniform vec3 light_pos[NUM_POINT_LIGHTS];
uniform float light_intensity;

varying vec3 norm;
varying vec3 view;
varying vec2 refract_uv;
varying vec2 screen_uv;
varying float water_depth;
varying vec3 water_position;

float readDepth() {
  float z = texture2D(depth_texture, refract_uv).x;
  return perspectiveDepthToViewZ(z, 0.1, 1000.0);
}

void main() {
  float fresnel = mix(0.1, 0.95, pow(1.0 - dot(norm, -view), 3.0));

  vec3 env_light = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
    float dis = distance(water_position, light_pos[i]);
    float intensity = exp(-dis * 0.5) * 2.0 * light_intensity;
    env_light += min(intensity, 0.05) * vec3(0.88, 0.68, 0.42);
  }
  
  vec2 uv = vec2(0.0, 0.0);
  if (water_depth > readDepth()) { // If we are sampling thing above water
    uv = screen_uv; // use the original uv instead of refracted uv
  }
  else {
    uv = refract_uv;
  }

  vec3 refract_color = texture2D(opaque_texture, uv).rgb * water_color;
  vec3 reflect_color = texture2D(reflected_texture, vec2(screen_uv.s, 1.0 - screen_uv.t)).rgb + env_light;
  gl_FragColor = vec4(mix(refract_color, reflect_color, fresnel), 1.0);
}
