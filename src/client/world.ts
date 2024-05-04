import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js'
import {UnrealBloomPass} from '/jsm/postprocessing/UnrealBloomPass.js'
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';

import { Water } from "./waters.js";
import { AABB, DepthPass } from "./pass/depth_pass.js";
import { RefractionPass } from "./pass/refraction_pass.js";
import { ReflectionPass } from "./pass/reflection_pass.js";

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

  private depthPass: DepthPass;
  private refracPass: RefractionPass;
  private reflectPass: ReflectionPass;

  private water: Water;

  private boxHelper: THREE.BoxHelper;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.clock = new THREE.Clock;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.composer = new EffectComposer(this.renderer);
    this.refracPass = new RefractionPass(this.camera);
    
    this.rain = new Rain(this.scene);

    document.body.appendChild(this.renderer.domElement);
  }

  public async setup() {
    await this.load_scene();
  }

  private load_water(pool: THREE.Mesh) {
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
    this.boxHelper = new THREE.BoxHelper(poolModel.scene, 0xffff00);
    this.scene.add(this.boxHelper);

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

    const box: AABB = [ new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
      new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z + halfSize.z) ];
    console.log('Bounding Box Vertices:', vertices);
    const bottom = center.y - halfSize.y;
    const top = center.y + halfSize.y;
    this.rain.set_depth_camera_props(top, bottom);


    //Bloom effect
    const renderPass = new RenderPass(this.scene, this.camera);
    // FIXME: find a correct threshold value.
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / window.innerHeight), 2.0,1.0,10);
    this.composer.addPass(renderPass);
    this.composer.addPass(bloomPass);

    // depth pass
    this.depthPass = new DepthPass(box);

    // cast shadow
    const names = ["Body_Body_0", "Marble", "Tile", "Table", "PLant1", "Plant2"];
    const enable_shadow = (mesh: THREE.Mesh) => {
      if (mesh === null || mesh === undefined) return;
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.children.forEach(enable_shadow);
    };
    for (const name of names) {
      const obj = poolModel.scene.getObjectByName(name) as THREE.Mesh;
      enable_shadow(obj);

      if (name === "Tile") {
        this.load_water(obj);
      }
    }

    // initial default setup of sunLight, lamp, and rain.
    this.set_rain(3000, 14, 0.003);
    this.set_lamp(3) ;
    this.set_sun([1,0,0], 0);

    await this.load_sky_box();
  }

  private async load_sky_box() {
    var picts = [
      './skybox/px.jpg',
      './skybox/nx.jpg',
      './skybox/py.jpg',
      './skybox/ny.jpg',
      './skybox/pz.jpg',
      './skybox/nz.jpg'
    ]

    const loader = new THREE.TextureLoader()
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000)
    const materialArray = []
    for (let i = 0; i < 6; i++)
      materialArray.push(
        new THREE.MeshBasicMaterial({
          map: loader.load(picts[i]),
          side: THREE.BackSide
        })
      )

    const skybox = new THREE.Mesh(skyGeometry, materialArray);
    this.scene.add(skybox);
  }

  public update() {
    requestAnimationFrame(this.update.bind(this));
    this.renderer.clear();

    this.boxHelper.visible = false;
    this.rain.set_visible(false);
    const depth = this.depthPass.render(this.renderer, this.scene);

    const water_vis = this.water.get_visible();
    this.water.set_visible(false);

    const [opaque, water_depth] = this.refracPass.render(this.renderer, this.scene);
    this.reflectPass.update_camera(this.camera, this.controls.target.clone());
    const reflected = this.reflectPass.render(this.renderer, this.scene);

    this.water.set_visible(water_vis);
    this.rain.set_visible(true);
    this.boxHelper.visible = true;

    const time = this.clock.getElapsedTime();
    if (this.water.get_visible()) {
      this.water.drop(this.rain.get_dropped_positions(time));
    }
    this.water.set_textures(opaque, water_depth, reflected);
    this.rain.set_raindropMaterial_uTime(time);
    this.rain.set_depth(depth);
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

  public set_water(visible: boolean) {
    this.water.set_visible(visible);
  }

}
