#include <packing>

uniform vec3 water_color;
uniform sampler2D opaque_texture;
uniform sampler2D depth_texture;

varying vec3 norm;
varying vec3 view;
varying vec2 refract_uv;
varying vec2 screen_uv;
varying float water_depth;

float readDepth() {
  float z = texture2D(depth_texture, refract_uv).x;
  return perspectiveDepthToViewZ(z, 0.1, 1000.0);
}

void main() {
  float fresnel = mix(0.5, 0.95, dot(norm, -view));
  
  vec2 uv = vec2(0.0, 0.0);
  if (water_depth > readDepth()) {
    uv = screen_uv;
  }
  else {
    uv = refract_uv;
  }

  vec3 refract_color = texture2D(opaque_texture, uv).rgb;
  gl_FragColor = vec4(mix(water_color, refract_color, fresnel), 1.0);
}
