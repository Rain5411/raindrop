uniform vec3 view_dir;

const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;

varying vec3 norm;
varying vec3 view;
varying vec2 refract_uv;

void main() {
  norm = (modelViewMatrix *  vec4(0.0, 1.0, 0.0, 0.0)).xyz; // TODO
  view = (modelViewMatrix * vec4(view_dir, 1.0)).xyz;
  vec3 refracted = refract(view, norm, IOR_AIR / IOR_WATER);
  vec4 target = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // + vec4(normalize(refracted), 1.0) - normalize(vec4(view_dir, 1.0));

  refract_uv = (target.xy / target.w) * 0.5 + 0.5;
  
  gl_Position = target;
}
