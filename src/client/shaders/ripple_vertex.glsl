varying vec2 screen_uv;

void main() {
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  screen_uv = (p.xy / p.w) * 0.5 + 0.5;
  gl_Position = p;
}
