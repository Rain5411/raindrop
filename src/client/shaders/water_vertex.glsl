const float airIOR = 1.0;
const float waterIOR = 1.333;

varying vec3 norm;
varying vec3 view;
varying vec2 refractUV;
varying vec2 screenUV;
varying float waterDepth;

void main() {
  norm = normalize((normalMatrix * normal));
  view = normalize(modelViewMatrix * vec4(position, 1.0)).xyz;
  vec3 refractDir = normalize(refract(view, norm, airIOR / waterIOR));
  vec4 target = projectionMatrix * (modelViewMatrix * (vec4(position, 1.0) + vec4(refractDir, 0.0) - vec4(view, 0.0)));

  refractUV = (target.xy / target.w) * 0.5 + 0.5;
  
  vec4 screenPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  screenUV = (screenPos.xy / screenPos.w) * 0.5 + 0.5;
  waterDepth = (modelViewMatrix * (vec4(position, 1.0) + vec4(refractDir, 0.0) - vec4(view, 0.0))).z;
  gl_Position = screenPos;
}
