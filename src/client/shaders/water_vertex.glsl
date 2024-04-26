uniform vec3 view_dir;

const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;

varying vec3 norm;
varying vec3 view;
varying vec2 refract_uv;
varying vec2 screen_uv;
varying float water_depth;

void main() {
  norm = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); // TODO
  view = normalize((modelViewMatrix * vec4(view_dir, 0.0)).xyz);
  vec3 refract_dir = normalize(refract(view, norm, IOR_AIR / IOR_WATER));
  vec4 target = projectionMatrix * (modelViewMatrix * vec4(position, 1.0) + vec4(refract_dir, 0.0) - vec4(view, 0.0));

  refract_uv = (target.xy / target.w) * 0.5 + 0.5;
  
  vec4 screen_pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  screen_uv = (screen_pos.xy / screen_pos.w) * 0.5 + 0.5;

  water_depth = target.z;

  gl_Position = screen_pos;
}
