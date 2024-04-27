varying vec2 uv;

void main() {
  uv = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = uv;
}
