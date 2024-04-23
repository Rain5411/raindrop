import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js'
import {UnrealBloomPass} from '/jsm/postprocessing/UnrealBloomPass.js'
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';

import rainVertexShader from "./shaders/rain_vertex.glsl";
import rainFragmentShader from "./shaders/rain_frag.glsl";

export class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private raindropMaterial: THREE.ShaderMaterial;

  private controls: OrbitControls;
  private composer: EffectComposer;
  
  private lampLightIntensity: number;

  // TODO: add water & particle system here.

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.clock = new THREE.Clock;
    this.raindropMaterial = new THREE.ShaderMaterial;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.composer = new EffectComposer(this.renderer);
    

    this.lampLightIntensity = 5;  //suggested max=5 
    // ================ This single variable controls the overall intensity of the light coming from the lamp ============
    // It controls:
    // 1. intensity of the THREE.PointLight itself
    // 2. EmissiveIntensity of the two lightbulbs of the lamb in model.glb
    // 3. Amount of light intensity applied to the fragment shader of raindrops (uLightFactor)


    document.body.appendChild(this.renderer.domElement);

    this.load_scene();
    this.init_rain();
  }

  private async load_scene() {

    // set initial camera position
    this.camera.position.z = 2;


    // first load our pool glb model
    const loader = new GLTFLoader();
    const poolModel = await loader.loadAsync('./model.glb');
    poolModel.scene.scale.set(1,1,1);
    const poolModelScene = poolModel.scene.getObjectByName('poolModel');
    if (poolModelScene)
        poolModelScene.visible = true;
    this.scene.add(poolModel.scene);


    const names = ["Body_Body_0", "Marble", "Tile", "Table", "PLant1", "Plant2"];
    for (const name of names) {
      const obj = poolModel.scene.getObjectByName(name) as THREE.Mesh;
      if (obj != null && obj != undefined) {
        obj.castShadow = obj.receiveShadow = true;
      }
    }

    // The two lightbulbs of the lamp glb is an emissive material.
    // Emissive material shares same uuid left and right, so modifying one will change emissiveIntensity of both.
    const lampLightBulb = poolModel.scene.getObjectByName('Light_Left_Emissive_0') as THREE.Mesh;
    const lampLightBulbMaterial = lampLightBulb.material as THREE.MeshStandardMaterial;
    lampLightBulbMaterial.emissiveIntensity = this.lampLightIntensity / 2.5; 

    // Initialize point lights - inside the two "lightbulb" parts of the lamp
    // TODO. Let users turn this on and off via UI to simulate lamp on and off.
    const pointLightLeft = new THREE.PointLight(0xf6f5af);
    pointLightLeft.position.set(-0.63, 2.08, 8.7);
    this.scene.add(pointLightLeft);
    pointLightLeft.color.set(0xe2af6c);
    pointLightLeft.intensity = this.lampLightIntensity;
    pointLightLeft.decay = 0.7;
    pointLightLeft.distance = 18;
    pointLightLeft.castShadow = true;

    const pointLightRight = new THREE.PointLight(0xf6f5af);
    pointLightRight.position.set(1.84, 2.08, 8.7);
    this.scene.add(pointLightRight);
    pointLightRight.color.set(0xe2af6c);
    pointLightRight.intensity = this.lampLightIntensity;
    pointLightRight.decay = 0.7;
    pointLightRight.distance = 18;
    pointLightRight.castShadow = true;


    // For debugging, draw a yellow bounding box around our poolmodel scene.
    const boundingBox = new THREE.Box3().setFromObject(poolModel.scene);
    const boxHelper = new THREE.BoxHelper(poolModel.scene, 0xffff00);
    this.scene.add(boxHelper);


    // For debugging, log the coordinate values of the 8 verticies of the bounding box of our pool model scene. This tells exact size of our "world"
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);
    
    const halfSize = size.multiplyScalar(0.5);
    const vertices = [
      new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
      new THREE.Vector3(center.x + halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
      new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z - halfSize.z),
      new THREE.Vector3(center.x - halfSize.x, center.y + halfSize.y, center.z - halfSize.z),
      new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z + halfSize.z),
      new THREE.Vector3(center.x + halfSize.x, center.y - halfSize.y, center.z + halfSize.z),
      new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z + halfSize.z),
      new THREE.Vector3(center.x - halfSize.x, center.y + halfSize.y, center.z + halfSize.z),
    ];
    console.log('Bounding Box Vertices:', vertices);

    //Bloom effect
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / window.innerHeight), 2.0,1.0,0);
    this.composer.addPass(renderPass);
    this.composer.addPass(bloomPass);

  }

  private init_rain() {
    this.raindropMaterial = new THREE.ShaderMaterial({
      vertexShader: rainVertexShader,
      fragmentShader: rainFragmentShader,
      transparent: true,
      uniforms: {
        uCount: {
          value: 0,
        },
        uTime: {
          value: 0,
        },
        uMaxSpeed: {
        // how fast the raindrop is falling. 
        // TODO, this value will be higher with heavier rain, change based on UI selection.
        value : 12,
        },
        uLightFactor: {
        value: this.lampLightIntensity/5,  // Light intensity on the raindrops also depend on overall light intensity
        },
        uPointLightPositions: {
          value: [], 
        },
      },
    });


    // number of raindrops in the scene. 
    // TODO, this value will be higher with heavier rain, change based on UI selection.
    const numRaindrops = 20000;

    const raindropGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);

    // InstancedMesh to create a lot of raindrops at once.
    let rainObject = new THREE.InstancedMesh(raindropGeometry, this.raindropMaterial, numRaindrops);
    const initRainInner = () => {
        const randNumsArray = new Float32Array(rainObject.count * 2);
        const randomNums = new THREE.InstancedBufferAttribute(randNumsArray, 2);
        raindropGeometry.setAttribute('aRandom', randomNums);
        this.raindropMaterial.uniforms.uCount.value = rainObject.count;
        for (let i = 0; i < randNumsArray.length; i++) {
            randNumsArray[i] = Math.random();
        }
        this.scene.add(rainObject);
    };
    initRainInner();
    
     // Size of each raindrop.
    const scale = 0.003
     
    raindropGeometry.scale(scale, 1, scale);

    // these coordinate positions are same as point light source coordinate positions defined in load_scene().
    const pointLightPositions = [new THREE.Vector3(-0.63,2.08,8.7 ), new THREE.Vector3(1.84,2.08,8.7 )];

    // pass on the positions of the two point lights to shader.
    this.raindropMaterial.uniforms.uPointLightPositions.value = pointLightPositions;


    if (numRaindrops < rainObject.count) {
        rainObject.count = numRaindrops;
    }
    else if (numRaindrops > rainObject.count) {
        this.scene.remove(rainObject);
        rainObject = new THREE.InstancedMesh(raindropGeometry, this.raindropMaterial, numRaindrops);
        initRainInner();
    }
  }

  public update() {
    requestAnimationFrame(this.update.bind(this));
    this.raindropMaterial.uniforms.uTime.value =  this.clock.getElapsedTime();
    this.controls.update();
    this.composer.render(); // we use this insteand of "this.renderer.render()" because otherwise the Bloom effect will not work.

  }

  public set_sunlight(dir: [number, number, number], intensity: number) {
    const dir_v = new THREE.Vector3(dir[0], dir[1], dir[2]);


    
    // This is going to be the sunlight? Parallel light.
    // TODO. Let users adjust this via UI to simulate morning, noon, afternoon, night.
    const directionaLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.scene.add(directionaLight);  

  }

  public switch_lamp() {
    // TODO:
  }
}
