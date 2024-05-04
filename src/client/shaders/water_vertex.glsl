const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;

varying vec3 norm;
varying vec3 view;
varying vec2 refract_uv;
varying vec2 screen_uv;
varying float water_depth;

void main() {
  norm = normalize((normalMatrix * normal));
  view = normalize(modelViewMatrix * vec4(position, 1.0)).xyz;
  vec3 refract_dir = normalize(refract(view, norm, IOR_AIR / IOR_WATER));
  const float water_height = 1.4; // height of water: 1.4
  float ref_coef = water_height / dot(-refract_dir, norm);
  float view_coef = water_height / dot(view, norm);
  vec4 target = projectionMatrix * (modelViewMatrix * (vec4(position, 1.0) + vec4(refract_dir, 0.0) * ref_coef - vec4(view, 0.0) * view_coef));

  refract_uv = (target.xy / target.w) * 0.5 + 0.5;
  
  vec4 screen_pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  screen_uv = (screen_pos.xy / screen_pos.w) * 0.5 + 0.5;
  water_depth = target.z;
  gl_Position = screen_pos;
}
