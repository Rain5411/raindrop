import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js'
import {UnrealBloomPass} from '/jsm/postprocessing/UnrealBloomPass.js'
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';

import { Rain } from "./rain.js";
import { LightController  } from "./light_controller.js";

export class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;


  private controls: OrbitControls;
  private composer: EffectComposer;

  // Created separate Class that handles all light-related logic - point light and sunlight
  private lightController: LightController;
  // Created separate Class that handles rain-related logic
  private rain: Rain;

  // TODO: add water & particle system here.

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.clock = new THREE.Clock;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.composer = new EffectComposer(this.renderer);
    
    this.rain = new Rain(this.scene);

    document.body.appendChild(this.renderer.domElement);

    this.load_scene();
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

    // initialize light controller, includes both sunLight and lamp pointlights
    this.lightController = new LightController(this.scene, poolModel);
    // pass the location of two lamp pointlights to rain shader. This info needed to calculate rain frag
    this.rain.set_raindropMaterial_uPointLightPositions(this.lightController.get_pointLightPositions());


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


    // initial default setup of sunLight, lamp, and rain.
    this.set_rain(3000, 14, 0.003);
    this.set_lamp(3) ;
    this.set_sun([1,0,0], 0);
  }



  public update() {
    requestAnimationFrame(this.update.bind(this));
    this.rain.set_raindropMaterial_uTime(this.clock.getElapsedTime());
    this.controls.update();
    this.composer.render(); // we use this insteand of "this.renderer.render()" because otherwise the Bloom effect will not work.
  }



  // Helper functions for changing the parameters. Evenlistener uses them to interact with UI buttons.
  // TODO: do we still need the dir?
  public set_sun(dir: [number, number, number], sunLightIntensity: number) {
    this.lightController.set_sunLightBrightness(sunLightIntensity);
    this.rain.set_raindropMaterial_uSunLightFactor(sunLightIntensity/2);
    // const dir_v = new THREE.Vector3(dir[0], dir[1], dir[2]);
    // this.scene.add(directionaLight);  
  }

  public set_lamp(lampLightIntensity: number) {
    this.lightController.set_lampBrightness(lampLightIntensity);
    this.rain.set_raindropMaterial_uPointLightFactor(lampLightIntensity/5);
  }

  public set_rain(numRaindrops: number, maxSpeed: number, scale: number){
    this.rain.remove_rain(); // remove existing rain and set new one.
    this.rain.set_raindropScale(scale, numRaindrops, maxSpeed);
    this.rain.init_rain();
  }

}
