import * as THREE from "/build/three.module.js";

import rainVertexShader from "./shaders/rain_vertex.glsl";
import rainFragmentShader from "./shaders/rain_frag.glsl";

export class Rain {
  private scene: THREE.Scene;

  private raindropMaterial: THREE.ShaderMaterial;
  private rainObject: THREE.InstancedMesh;

  private numRaindrops: number;
  private raindropScale: number;

  private dropFuns: Array<(t: number) => number>;
  private droppedPositions: THREE.Vector3[];


  constructor(scene: THREE.Scene){

    this.scene = scene;

    this.raindropMaterial = new THREE.ShaderMaterial({
      vertexShader: rainVertexShader,
      fragmentShader: rainFragmentShader,
      transparent: true,
      uniforms: {
        uTime: {
          value: 0,
        },
        uMaxSpeed: {
          value : 0,
        },
        uPointLightFactor: {
          value: 0,
        },
        uSunLightFactor: {
          value: 0,
        },
        uPointLightPositions: {
          value: []
        },
      },
    });

  }

  public set_raindropMaterial_uTime(elapsedTime: number){
    this.raindropMaterial.uniforms.uTime.value = elapsedTime;
  }

  public set_raindropMaterial_uPointLightFactor(intensity: number){
    this.raindropMaterial.uniforms.uPointLightFactor.value = intensity;
  }

  public set_raindropMaterial_uSunLightFactor(intensity: number){
    this.raindropMaterial.uniforms.uSunLightFactor.value = intensity;
  }

  public set_raindropMaterial_uPointLightPositions(pointLightPos: Array<THREE.Vector3>){
    this.raindropMaterial.uniforms.uPointLightPositions.value = pointLightPos;
  }

  public set_raindropScale(scale: number, numRainDrops: number, rainSpeed: number){
    this.raindropScale = scale;
    this.numRaindrops = numRainDrops;
    this.raindropMaterial.uniforms.uMaxSpeed.value = rainSpeed;
  }

  public set_visible(vis: boolean) {
    this.rainObject.visible = vis;
  }

  private rand(co: THREE.Vector2): number {
    return Math.sin(co.dot(new THREE.Vector2(12.9898, 78.233)) * 43758.5453) % 1;
  }

  public init_rain() { // I simplified the rain logic
    const raindropGeometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false);
    raindropGeometry.scale(this.raindropScale, 1, this.raindropScale);

    // InstancedMesh to create a lot of raindrops at once.
    this.rainObject = new THREE.InstancedMesh(raindropGeometry, this.raindropMaterial, this.numRaindrops);
    const randNumsArray = new Float32Array(this.rainObject.count * 2);
    const randomNums = new THREE.InstancedBufferAttribute(randNumsArray, 2);
    raindropGeometry.setAttribute('aRandom', randomNums);

    for (let i = 0; i < randNumsArray.length; i++) {
        randNumsArray[i] = Math.random();
    }
    this.scene.add(this.rainObject);

    this.droppedPositions = [];
    this.dropFuns = [];
    const lerp = (s: number, e: number, t: number) => s * t + e * (1 - t);
    for (let i = 0; i < this.rainObject.count; ++i) {
      const stride = i * 2;
      this.droppedPositions.push(new THREE.Vector3(
        lerp(-3.431, 4.918, randNumsArray[stride]),
        lerp(-8.392, 10.435, randNumsArray[stride + 1]),
        0
      ));
      this.dropFuns.push((t: number) => {
        const y = this.rand(new THREE.Vector2((randNumsArray[stride] + 0.2) % 1, (randNumsArray[stride + 1] + 0.2) % 1)) * 7.319 - 4.717
        const size = this.rand((new THREE.Vector2((randNumsArray[stride] - 4.717) % 1, (randNumsArray[stride + 1] - 4.717) % 1))) * 0.4 + 0.6;
        const speed = 12 * (this.rand(new THREE.Vector2((randNumsArray[stride] + 0.6) % 1, (randNumsArray[stride + 1] + 0.6) % 1)) * 0.4 + 0.6) * (size / 2.0 + 0.5);
        return (y - speed * t) % 7.319 - 4.717;
      });
    }
  }

  public get_dropped_positions(time: number): THREE.Vector3[] {
    for (let i = 0; i < this.droppedPositions.length; ++i) {
      this.droppedPositions[i].z = this.dropFuns[i](time);
    }

    return this.droppedPositions;
  }

  public remove_rain(){
    this.scene.remove(this.rainObject);
  }
}
