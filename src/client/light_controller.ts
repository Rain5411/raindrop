import * as THREE from "/build/three.module.js";
import { GLTF } from '/jsm/loaders/GLTFLoader.js';


export class LightController {

    private scene: THREE.Scene;


    // lamp related parameters
    private poolModel: GLTF;

    private lampLightIntensity: number;
            // This single variable controls the overall intensity of the light coming from the lamp
            // It controls:
            // 1. intensity of the THREE.PointLight itself
            // 2. EmissiveIntensity of the two lightbulbs of the lamb in model.glb
            // 3. Amount of light intensity applied to the fragment shader of raindrops (uLightFactor)

    private pointLightLeft: THREE.PointLight;
    private pointLightRight: THREE.PointLight;

    private pointLightLeft_Pos: THREE.Vector3;
    private pointLightRight_Pos: THREE.Vector3;

    private lampLightBulbMaterial: THREE.MeshStandardMaterial;

    
    // sunLight related parameters
    private sunLight: THREE.DirectionalLight;
    private sunLightIntensity: number;


    constructor(scene: THREE.Scene, poolModel: GLTF){

        this.scene = scene;


        // ================== lamp related ======================
        this.poolModel = poolModel;


        this.pointLightLeft_Pos = new THREE.Vector3(-0.63,2.08,8.7);
        this.pointLightRight_Pos = new THREE.Vector3(1.84,2.08,8.7);
        // pointlight positions should not change

        // The two lightbulbs of the lamp glb is an emissive material.
        // Emissive material shares same uuid left and right, so modifying one will change emissiveIntensity of both.
        const lampLightBulb = this.poolModel.scene.getObjectByName('Light_Left_Emissive_0') as THREE.Mesh;
        this.lampLightBulbMaterial = lampLightBulb.material as THREE.MeshStandardMaterial;

        // Initialize point lights - inside the two "lightbulb" parts of the lamp
        // TODO. Let users turn this on and off via UI to simulate lamp on and off.
        this.pointLightLeft = new THREE.PointLight(0xe2af6c);
        this.pointLightLeft.position.set(this.pointLightLeft_Pos.x, this.pointLightLeft_Pos.y, this.pointLightLeft_Pos.z);
        this.scene.add(this.pointLightLeft);
        this.pointLightLeft.decay = 0.7;
        this.pointLightLeft.distance = 18;
        this.pointLightLeft.castShadow = true;
        this.pointLightLeft.shadow.bias = -0.01;

        this.pointLightRight = new THREE.PointLight(0xe2af6c);
        this.pointLightRight.position.set(this.pointLightRight_Pos.x, this.pointLightRight_Pos.y, this.pointLightRight_Pos.z);
        this.scene.add(this.pointLightRight);
        this.pointLightRight.decay = 0.7;
        this.pointLightRight.distance = 18;
        this.pointLightRight.castShadow = true;
        this.pointLightRight.shadow.bias = -0.01;


        // ================== sunLight related ======================
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0);
        this.sunLight.castShadow = true;
        this.sunLight.target = this.poolModel.scene;
        this.scene.add(this.sunLight);

    }

    public set_lampBrightness(lampLightIntensity){
        this.lampLightIntensity = lampLightIntensity;
        this.pointLightLeft.intensity = this.lampLightIntensity;
        this.pointLightRight.intensity = this.lampLightIntensity;

        if (lampLightIntensity > 0)
            this.lampLightBulbMaterial.emissiveIntensity = 1 + this.lampLightIntensity / 2.5; 
        else
            this.lampLightBulbMaterial.emissiveIntensity = 0
    }
    

    public set_sunLightBrightness(intensity){
        this.sunLightIntensity = intensity
        this.sunLight.intensity = this.sunLightIntensity;
    }

    public set_sunLightPosition(pos: THREE.Vector3){
      this.sunLight.position.set(pos.x, pos.y, pos.z);
    }
    
    public get_lampLightIntensity(){
        return this.lampLightIntensity;
    }

    public get_pointLightPositions(){
        return [this.pointLightLeft_Pos, this.pointLightRight_Pos];
    }

    public get_sunLightIntensity(){
        return this.sunLightIntensity;
    }


}
