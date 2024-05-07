import * as THREE from "/build/three.module.js";
import { GLTF } from '/jsm/loaders/GLTFLoader.js';

export class LightController {
  private scene: THREE.Scene;

  private poolModel: GLTF;
  private pointLightLeft: THREE.PointLight;
  private pointLightRight: THREE.PointLight;

  private pointLightLeftPos: THREE.Vector3;
  private pointLightRightPos: THREE.Vector3;

  private lampLightBulbMaterial: THREE.MeshStandardMaterial;
    
  // * sunLight related parameters
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(scene: THREE.Scene, poolModel: GLTF){
    this.scene = scene;

    // * ================== lamp related ======================
    this.poolModel = poolModel;
    // * pointlight positions should not change
    this.pointLightLeftPos = new THREE.Vector3(-0.63, 2.08, 8.7);
    this.pointLightRightPos = new THREE.Vector3(1.84, 2.08, 8.7);

    // * the two lightbulbs of the lamp glb is an emissive material.
    // * emissive material shares same uuid left and right, so modifying one will change emissiveIntensity of both.
    const lampLightBulb = this.poolModel.scene.getObjectByName('Light_Left_Emissive_0') as THREE.Mesh;
    this.lampLightBulbMaterial = lampLightBulb.material as THREE.MeshStandardMaterial;

    // * initialize point lights - inside the two "lightbulb" parts of the lamp
    const pointLightColor = 0xe2af6c;
    const pointLightDecay = 0.7;
    const pointLightDis = 18.0;
    const pointLightBias = -0.01;
    this.pointLightLeft = new THREE.PointLight(pointLightColor);
    this.pointLightLeft.position.set(this.pointLightLeftPos.x, this.pointLightLeftPos.y, this.pointLightLeftPos.z);
    this.scene.add(this.pointLightLeft);
    this.pointLightLeft.decay = pointLightDecay;
    this.pointLightLeft.distance = pointLightDis;
    this.pointLightLeft.castShadow = true;
    this.pointLightLeft.shadow.bias = pointLightBias;

    this.pointLightRight = new THREE.PointLight(pointLightColor);
    this.pointLightRight.position.set(this.pointLightRightPos.x, this.pointLightRightPos.y, this.pointLightRightPos.z);
    this.scene.add(this.pointLightRight);
    this.pointLightRight.decay = pointLightDecay;
    this.pointLightRight.distance = pointLightDis;
    this.pointLightRight.castShadow = true;
    this.pointLightRight.shadow.bias = pointLightBias;

    // * ================== sunLight related ======================
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0);
    this.sunLight.castShadow = true;
    this.sunLight.target = this.poolModel.scene;
    this.scene.add(this.sunLight);

    // * add an ambient light so that the unlighted area will not look so dark
    this.ambientLight = new THREE.AmbientLight(pointLightColor, 0.1);
    this.scene.add(this.ambientLight);
  }

  /**
   * @param lampLightIntensity controls the overall intensity of the light coming from the lamp
   * * 1. intensity of the THREE.PointLight itself
   * * 2. EmissiveIntensity of the two lightbulbs of the lamb in model.glb
   * * 3. Amount of light intensity applied to the fragment shader of raindrops (uLightFactor)
   */
  public setLampBrightness(lampLightIntensity: number) {
    this.pointLightLeft.intensity = lampLightIntensity;
    this.pointLightRight.intensity = lampLightIntensity;
    this.ambientLight.intensity = lampLightIntensity / 10.0;

    if (lampLightIntensity > 0)
      this.lampLightBulbMaterial.emissiveIntensity = 1 + lampLightIntensity / 2.5; 
    else
      this.lampLightBulbMaterial.emissiveIntensity = 0;
  }
    
  public setSunLightBrightness(intensity: number) {
    this.sunLight.intensity = intensity;
  }

  public setSunLightPosition(pos: THREE.Vector3) {
    this.sunLight.position.set(pos.x, pos.y, pos.z);
  }

  public getPointLightPositions(): [THREE.Vector3, THREE.Vector3]{
    return [this.pointLightLeftPos, this.pointLightRightPos];
  }
}
