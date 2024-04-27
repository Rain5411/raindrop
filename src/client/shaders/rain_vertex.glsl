uniform float uCount;
uniform float uTime;
uniform float uMaxSpeed;
// uniform vec3 uPointLightPositions[NUM_POINT_LIGHTS]; // positions of the two point light sources in the light bulbs
      
attribute vec2 aRandom; // just random number between 0~1

varying vec3 raindropPosition;
varying vec2 depthUV;

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
  float raindropPositionY = rand(fract(aRandom + 0.2)) * 7.319 - 4.717;   
  // 7.319 is the height of the entire pool scene bounding box. 4.717 is displacement. 
      
  float size = rand(fract(aRandom +- 4.717)) * 0.4 + 0.6;
      
  float speed = uMaxSpeed * (rand(fract(aRandom + 0.6)) * 0.4 + 0.6) * (size / 2.0 + 0.5);
  raindropPositionY -= uTime * speed;

  float fallNum = floor(raindropPositionY / 7.319);
  float fallNumRand = fract(fallNum / 12345.678);
  raindropPositionY = mod(raindropPositionY, 7.319) - 4.717;

  // int lightIndex = int(floor(rand(fract(aRandom + fallNumRand + 0.34)) * float(NUM_POINT_LIGHTS)));
  // vec3 lightPosition = uPointLightPositions[lightIndex];
      
  depthUV = vec2(aRandom.x, 1.0 - aRandom.y);
  raindropPosition = vec3(
    mix(-3.431, 4.918, aRandom.x),    // edge coordinates of the entire pool scene bounding box 
    raindropPositionY,
    mix(-8.392, 10.435, aRandom.y)    // edge coordinates of the entire pool scene bounding box 
  );


  float distPerFrame = (speed) / 60.0;
      
  vec4 mvPosition = vec4(position, 1.0);
  mvPosition = modelViewMatrix 
    // * translationMatrix(lightPosition)
    // * translationMatrix(-lightPosition)
    * translationMatrix(raindropPosition)
    * scaleMatrix(vec3(size, distPerFrame, size))
    * mvPosition;
    
      
  gl_Position = projectionMatrix * mvPosition;
}
