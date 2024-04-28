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

  private depthPass: DepthPass;
  private bottom: number;
  private top: number;

  private refracPass: RefractionPass;
  private reflectPass: ReflectionPass;

  private water: Water;
  private rain: THREE.InstancedMesh; // TODO: move to another class

  private boxHelper: THREE.BoxHelper;

  private dropFuns: Array<(t: number) => number>;
  private droppedPositions: THREE.Vector3[];

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
    this.refracPass = new RefractionPass(this.camera);
    

    this.lampLightIntensity = 5;  //suggested max=5 
    // ================ This single variable controls the overall intensity of the light coming from the lamp ============
    // It controls:
    // 1. intensity of the THREE.PointLight itself
    // 2. EmissiveIntensity of the two lightbulbs of the lamb in model.glb
    // 3. Amount of light intensity applied to the fragment shader of raindrops (uLightFactor)


    document.body.appendChild(this.renderer.domElement);
  }

  public async setup() {
    await this.load_scene();
    this.init_rain();
  }

  private load_water(pool: THREE.Mesh, top: number) {
    const boundingBox = new THREE.Box3().setFromObject(pool);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);
    
    center.y += size.y / 4.0;
    const halfSize = size.clone().multiplyScalar(0.5);

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
    this.bottom = center.y - halfSize.y;
    this.top = center.y + halfSize.y;

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
        this.load_water(obj, center.y + halfSize.y);
      }
    }

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

    const skybox = new THREE.Mesh(skyGeometry, materialArray) 
    this.scene.add(skybox)
  }

  private rand(co: THREE.Vector2): number {
    return Math.sin(co.dot(new THREE.Vector2(12.9898, 78.233)) * 43758.5453) % 1;
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
        near: {
          value: this.top
        },
        far: {
          value: this.bottom
        },
        depth: {
          value: null
        }
      },
    });


    // number of raindrops in the scene. 
    // TODO, this value will be higher with heavier rain, change based on UI selection.
    const numRaindrops = 2000;

    const raindropGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);

    // InstancedMesh to create a lot of raindrops at once.
    this.rain = new THREE.InstancedMesh(raindropGeometry, this.raindropMaterial, numRaindrops);
    const initRainInner = () => {
        const randNumsArray = new Float32Array(this.rain.count * 2);
        const randomNums = new THREE.InstancedBufferAttribute(randNumsArray, 2);
        raindropGeometry.setAttribute('aRandom', randomNums);
        this.raindropMaterial.uniforms.uCount.value = this.rain.count;
        for (let i = 0; i < randNumsArray.length; i++) {
            randNumsArray[i] = Math.random();
        }
        this.droppedPositions = [];
        this.dropFuns = [];
        const lerp = (s: number, e: number, t: number) => s * t + e * (1 - t);
        for (let i = 0; i < this.rain.count; ++i) {
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
        this.scene.add(this.rain);
    };
    initRainInner();
    
     // Size of each raindrop.
    const scale = 0.003
     
    raindropGeometry.scale(scale, 1, scale);

    // these coordinate positions are same as point light source coordinate positions defined in load_scene().
    const pointLightPositions = [new THREE.Vector3(-0.63,2.08,8.7 ), new THREE.Vector3(1.84,2.08,8.7 )];

    // pass on the positions of the two point lights to shader.
    this.raindropMaterial.uniforms.uPointLightPositions.value = pointLightPositions;


    if (numRaindrops < this.rain.count) {
      this.rain.count = numRaindrops;
    }
    else if (numRaindrops > this.rain.count) {
        this.scene.remove(this.rain);
        this.rain = new THREE.InstancedMesh(raindropGeometry, this.raindropMaterial, numRaindrops);
        initRainInner();
    }
  }

  public update() {
    requestAnimationFrame(this.update.bind(this));
    this.renderer.clear();

    this.boxHelper.visible = false;
    this.rain.visible = false;
    const depth = this.depthPass.render(this.renderer, this.scene);

    this.water.set_visible(false);

    const [opaque, water_depth] = this.refracPass.render(this.renderer, this.scene);
    this.reflectPass.update_camera(this.camera, this.controls.target.clone());
    const reflected = this.reflectPass.render(this.renderer, this.scene);

    this.water.set_visible(true);
    this.rain.visible = true;
    this.boxHelper.visible = true;

    const time = this.clock.getElapsedTime();
    for (let i = 0; i < this.rain.count; ++i) {
      this.droppedPositions[i].z = this.dropFuns[i](time);
    }
    this.water.drop(this.droppedPositions);
    this.raindropMaterial.uniforms.uTime.value = time;
    this.raindropMaterial.uniforms.depth.value = depth;
    this.water.set_textures(opaque, water_depth, reflected);
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
