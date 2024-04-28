uniform sampler2D raindrops;
uniform sampler2D heights;
uniform float damping;

varying vec2 screen_uv;


float get_h(vec2 pos) {
  return texture2D(heights, pos).r;
}

float shallow_wave(float old) {
  const vec2 dx = vec2(0.01, 0.0);
  const vec2 dy = vec2(0.0, 0.01);

  float delta = get_h(screen_uv + dx) + get_h(screen_uv - dx)
    + get_h(screen_uv + dy) + get_h(screen_uv - dy) - 4 * old;
  return old + delta * 0.25 * damping;
}

void main() {
  float height = get_h(screen_uv);
  height += texture2D(raindrops, screen_uv).r;
  gl_FragColor = vec4(shallow_wave(height), 0.0, 0.0, 1.0);
}
