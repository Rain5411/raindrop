varying vec2 screen_uv;
varying float depth;

void main() {
  vec4 p = (projectionMatrix * modelViewMatrix * vec4(position, 1.0));
  screen_uv = p.st;
  depth = p.z;
  gl_Position = p;
}
