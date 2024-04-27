import * as THREE from "/build/three.module.js";

import rainVertexShader from "./shaders/rain_vertex.glsl";
import rainFragmentShader from "./shaders/rain_frag.glsl";

export class Rain {
  private scene: THREE.Scene;

  private raindropMaterial: THREE.ShaderMaterial;
  private rainObject: THREE.InstancedMesh;

  private numRaindrops: number;
  private raindropScale: number;


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

  public set_raindropMaterial_uMaxSpeed(rainSpeed: number){
    this.raindropMaterial.uniforms.uMaxSpeed.value = rainSpeed;
  }

  public set_raindropMaterial_uPointLightPositions(pointLightPos: Array<THREE.Vector3>){
    this.raindropMaterial.uniforms.uPointLightPositions.value = pointLightPos;
  }

  public set_numRainDrops(numRainDrops: number){
    this.numRaindrops = numRainDrops;
  }

  public set_raindropScale(scale: number){
    this.raindropScale = scale;  
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
  }

  public remove_rain(){
    this.scene.remove(this.rainObject);
  }
}
