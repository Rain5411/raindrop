uniform vec3 water_color;
uniform sampler2D opaque_texture;

varying vec3 norm;
varying vec3 view;
varying vec2 refract_uv;

void main() {
  float fresnel = mix(0.5, 0.95, dot(norm, -view));
  vec3 refract_color = texture2D(opaque_texture, refract_uv).rgb;

  gl_FragColor = vec4(mix(water_color, refract_color, fresnel), 1.0);
}
