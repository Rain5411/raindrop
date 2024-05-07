uniform float uTime;
uniform float uMaxSpeed;
      
attribute vec2 aRandom; // * just two random numbers between 0~1

varying vec3 raindropPosition;
varying vec2 depthUV;

const float modelHeight = 7.319;
const float displacement = 4.717;
const float left = -3.431;
const float right = 4.918;
const float top = 10.435;
const float bottom = -8.392;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

mat4 translationMatrix(vec3 translation) {
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    translation.x, translation.y, translation.z, 1.0
  );
}
      
mat4 scaleMatrix(vec3 scale) {
  return mat4(
    scale.x, 0.0, 0.0, 0.0,
    0.0, scale.y, 0.0, 0.0,
    0.0, 0.0, scale.z, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

void main() {
  float raindropPositionY = rand(fract(aRandom + 0.2)) * modelHeight - displacement;   

  float size = rand(fract(aRandom +- displacement)) * 0.4 + 0.6;
      
  float speed = uMaxSpeed * (rand(fract(aRandom + 0.6)) * 0.4 + 0.6) * (size / 2.0 + 0.5);
  raindropPositionY -= uTime * speed;
  raindropPositionY = mod(raindropPositionY, modelHeight) - displacement;
      
  depthUV = vec2(aRandom.x, 1.0 - aRandom.y);
  raindropPosition = vec3(
    mix(left, right, aRandom.x), // * edge coordinates of the entire pool scene bounding box 
    raindropPositionY,
    mix(bottom, top, aRandom.y) // * edge coordinates of the entire pool scene bounding box 
  );

  float distPerFrame = (speed) / 60.0;
  vec4 mvPosition = vec4(position, 1.0);
  mvPosition = modelViewMatrix 
    * translationMatrix(raindropPosition)
    * scaleMatrix(vec3(size, distPerFrame, size))
    * mvPosition;

  gl_Position = projectionMatrix * mvPosition;
}
