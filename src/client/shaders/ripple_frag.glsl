uniform sampler2D raindrops;
uniform sampler2D heights;
uniform bool has_drop;
uniform float near;
uniform float far;
uniform float damping;
uniform float rate;

varying vec2 uv;
varying float depth;

float readDepth() {
  float z = texture2D(raindrops, uv).x;
  return orthographicDepthToViewZ(z, 1.0, near - far + 1.0);
}

vec4 pack(float depth) {
  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
  vec4 rgbaDepth = fract(depth * bitShift);
  rgbaDepth -= rgbaDepth.gbaa * bitMask;
  return rgbaDepth;
}

float unpack(vec4 rgbaDepth) {
  const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
  return dot(rgbaDepth, bitShift);
}

float get_h(vec2 pos) {
  return unpack(texture2D(heights, pos));
}

bool check(vec2 pos) {
  return pos.x >= 0.0 && pos.x <= 1.0 && pos.y >= 0.0 && pos.y <= 0.0;
}

float shallow_wave(float old) {
  const vec2 dx = vec2(0.01, 0.0);
  const vec2 dy = vec2(0.0, 0.01);

  float delta = 0.0;
  if (check(uv + dx)) {
    delta += rate * (get_h(uv + dx) - old);
  }
  if (check(uv - dx)) {
    delta += rate * (get_h(uv - dx) - old);
  }
  if (check(uv + dy)) {
    delta += rate * (get_h(uv + dy) - old);
  }
  if (check(uv - dy)) {
    delta += rate * (get_h(uv - dy) - old);
  }

  float new = old + delta * rate;
  return old + (new - old) * damping;
}

void main() {
  float height = get_h(uv);
  if (has_drop && readDepth() <= depth) {
    height += 0.05; // TODO: uniform?
  }

  gl_FragColor = pack(shallow_wave(height));
}
