import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "/jsm/loaders/GLTFLoader.js";

import { EffectComposer } from "/jsm/postprocessing/EffectComposer.js"
import { UnrealBloomPass } from "/jsm/postprocessing/UnrealBloomPass.js"
import { RenderPass } from "/jsm/postprocessing/RenderPass.js";

import { Water } from "./waters.js";
import { AABB, DepthPass } from "./pass/depth_pass.js";
import { RefractionPass } from "./pass/refraction_pass.js";
import { ReflectionPass } from "./pass/reflection_pass.js";

import { Rain } from "./rain.js";
import { LightController } from "./light_controller.js";

import Stats from "/addons/stats.module.js";

export class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private stats: Stats;

  private controls: OrbitControls;
  private composer: EffectComposer;

  // * handle all light-related logic - point light and sunlight
  private lightController: LightController;
  // * handle rain-related logic
  private rain: Rain;

  private depthPass: DepthPass;
  private bloomPass: UnrealBloomPass;
  private refracPass: RefractionPass;
  private reflectPass: ReflectionPass;

  private water: Water;
  private skybox: THREE.Mesh;

  private boxHelper: THREE.BoxHelper;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(25, 14, 2);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.clock = new THREE.Clock;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = 1.4; // * limit orbitcontrol

    this.composer = new EffectComposer(this.renderer);
    this.refracPass = new RefractionPass(this.camera);
    
    this.rain = new Rain(this.scene);

    this.stats = new Stats();
		document.body.appendChild(this.stats.dom);
    document.body.appendChild(this.renderer.domElement);
    window.onresize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    this.skybox = null;
  }

  public async setup() {
    await this.loadScene();
  }

  private loadWater(pool: THREE.Mesh) {
    const boundingBox = new THREE.Box3().setFromObject(pool);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);
    
    center.y += size.y / 4.0;
    this.water = new Water(this.scene, new THREE.Vector2(size.x - 0.5, size.z - 0.5), center);

    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), center.clone().add(new THREE.Vector3(0, size.y / 4.0 + 0.1, 0)));
    this.reflectPass = new ReflectionPass(this.camera, plane, this.controls.target);
  }

  private async loadScene() {
    // * set initial camera position
    this.camera.position.z = 2;

    // * first load our pool glb model
    const loader = new GLTFLoader();
    const poolModel = await loader.loadAsync("./model.glb");
    poolModel.scene.scale.set(1, 1, 1);
    const poolModelScene = poolModel.scene.getObjectByName("poolModel");
    if (poolModelScene)
        poolModelScene.visible = true;
    this.scene.add(poolModel.scene);

    // * initialize light controller, includes both sunLight and lamp pointlights
    this.lightController = new LightController(this.scene, poolModel);
    // * pass the location of two lamp pointlights to rain shader. this info needed to calculate rain frag
    this.rain.setRaindropMaterialuPointLightPositions(this.lightController.getPointLightPositions());


    // * for debugging, draw a yellow bounding box around our poolmodel scene.
    const boundingBox = new THREE.Box3().setFromObject(poolModel.scene);
    this.boxHelper = new THREE.BoxHelper(poolModel.scene, 0xffff00);

    // * for debugging, log the coordinate values of the 8 verticies of the bounding box of our pool model scene.
    // * this tells exact size of our "world"
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

    const box: AABB = [ new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
      new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z + halfSize.z) ];
    console.log("Bounding Box Vertices:", vertices);
    const bottom = center.y - halfSize.y;
    const top = center.y + halfSize.y;
    this.rain.setDepthCameraProps(top, bottom);

    // * bloom effect
    const renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / window.innerHeight), 1.0, 1.0, 1.0);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);

    // * depth pass
    this.depthPass = new DepthPass(box);

    // * cast shadow
    const names = ["Body_Body_0", "Marble", "Tile", "Table", "PLant1", "Plant2", "lamp"];
    const enable_shadow = (mesh: THREE.Mesh) => {
      if (mesh === null || mesh === undefined) return;
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.children.forEach(enable_shadow);
    };
    for (const name of names) {
      const obj = poolModel.scene.getObjectByName(name) as THREE.Mesh;
      enable_shadow(obj);

      if (name === "Tile") {
        this.loadWater(obj);
      }
    }

    // * initial default setup of sunLight, lamp, and rain.
    this.setRain(3000, 14, 0.005, 0.015);
    this.setLamp(3) ;
    this.setSun([0, 0, -1], 0, 0);
  }

  private async loadSkybox(skyboxBrightnessIndex: number) {
    if (this.skybox !== null) {
      this.scene.remove(this.skybox);
    }

    if (skyboxBrightnessIndex > -1 && skyboxBrightnessIndex < 6){
      const picts = [
        `./skybox/brightness_${skyboxBrightnessIndex}/px.jpg`,
        `./skybox/brightness_${skyboxBrightnessIndex}/nx.jpg`,
        `./skybox/brightness_${skyboxBrightnessIndex}/py.jpg`,
        `./skybox/brightness_${skyboxBrightnessIndex}/ny.jpg`,
        `./skybox/brightness_${skyboxBrightnessIndex}/pz.jpg`,
        `./skybox/brightness_${skyboxBrightnessIndex}/nz.jpg`
      ]
    
      const loader = new THREE.TextureLoader();
      const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
      const materialArray = picts.map((path: string) => new THREE.MeshBasicMaterial({
        map: loader.load(path),
        side: THREE.BackSide
      }));
    
      this.skybox = new THREE.Mesh(skyGeometry, materialArray);
      this.scene.add(this.skybox);
    }
  }

  public update() {
    requestAnimationFrame(this.update.bind(this));
    const fps = 1 / this.clock.getDelta();
    this.stats.update();

    this.boxHelper.visible = false;
    this.rain.setVisible(false);
    const depth = this.depthPass.render(this.renderer, this.scene);

    this.water.setVisible(false);

    const [opaque, water_depth] = this.refracPass.render(this.renderer, this.scene);
    this.reflectPass.updateCamera(this.camera, this.controls.target.clone());
    const reflected = this.reflectPass.render(this.renderer, this.scene);

    this.water.setVisible(true);
    this.rain.setVisible(true);
    this.boxHelper.visible = true;

    const time = this.clock.getElapsedTime() * (30 / fps);
    this.water.drop(this.rain.getDroppedPositions(time), fps);
    this.water.setTextures(opaque, water_depth, reflected);
    this.rain.setRaindropMaterialuTime(time);
    this.rain.setDepth(depth);
    this.controls.update();
    this.composer.render(); // * we use this insteand of "this.renderer.render()" because otherwise the Bloom effect will not work.
  }

  // * helper functions for changing the parameters. evenlistener uses them to interact with UI buttons.
  public async setSun(pos: [number, number, number], sunLightIntensity: number, skyboxBrightnessIndex: number) {
    await this.loadSkybox(skyboxBrightnessIndex);
    this.lightController.setSunLightBrightness(sunLightIntensity);

    this.lightController.setSunLightPosition(new THREE.Vector3(pos[0], pos[1], pos[2]));
    this.rain.setRaindropMaterialuSunLightFactor(sunLightIntensity/2);

    if(sunLightIntensity === 0) {
      this.bloomPass.strength = 1.0;
    }
    else {
      this.bloomPass.strength = 0.3;
    }
  }

  public setLamp(lampLightIntensity: number) {
    this.lightController.setLampBrightness(lampLightIntensity);
    this.rain.setRaindropMaterialuPointLightFactor(lampLightIntensity/5);
  }

  public setRain(numRaindrops: number, maxSpeed: number, scale: number, splashStregnth: number){
    this.rain.removeRain(); // * remove existing rain and set new one.
    this.rain.setRaindropScale(scale, numRaindrops, maxSpeed);
    this.rain.initRain();
    this.water.setDlt(splashStregnth);
  }
}
