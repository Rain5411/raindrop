// import * as THREE from "/build/three.module.js";
// import { GLTFLoader } from "/jsm/loaders/GLTFLoader.js"
// import { OrbitControls } from "/jsm/controls/OrbitControls.js";

// export class World {
//   private scene: THREE.Scene;
//   private camera: THREE.PerspectiveCamera;
//   private renderer: THREE.WebGLRenderer;
//   private sunlight: THREE.DirectionalLight;
//   private controls: OrbitControls;

//   // TODO: add water & particle system here.

//   constructor() {
//     this.scene = new THREE.Scene();
//     this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 32768);
//     this.renderer = new THREE.WebGLRenderer();
//     this.renderer.setSize(window.innerWidth, window.innerHeight);
//     document.body.appendChild(this.renderer.domElement);

//     this.load_scene();
//     this.set_camera();
//   }

//   private load_scene() {
//     const loader = new GLTFLoader();
//     const self = this;

//     loader.load("/model.glb", (data) => {
//       const models = data.scene;
//       models.position.set(0, 0, 0);

//       self.scene.add(models);
//     }, undefined, (err) => { console.error(err); });

//     this.sunlight = new THREE.DirectionalLight();
//     this.sunlight.position.set(1, 1, 0.5);
//     this.scene.add(this.sunlight);
//   }

//   private set_camera() {
//     this.camera.position.set(0, 0, 0);
//     this.controls = new OrbitControls(this.camera, this.renderer.domElement);

//     this.controls.listenToKeyEvents( window );
// 		this.controls.enableDamping = true;
// 		this.controls.dampingFactor = 0.05;
// 		this.controls.screenSpacePanning = false;
// 		this.controls.minDistance = 0.1;
// 		this.controls.maxDistance = 8;
// 		this.controls.maxPolarAngle = Math.PI / 2;
//   }

//   public update() {
//     requestAnimationFrame(this.update.bind(this));
    
//     this.controls.update();
//     this.renderer.render(this.scene, this.camera);
//   }

//   public set_sunlight(dir: [number, number, number], intensity: number) {
//     const dir_v = new THREE.Vector3(dir[0], dir[1], dir[2]);

//     // TODO:
//   }

//   public switch_lamp() {
//     // TODO:
//   }
// }







import * as THREE from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls.js";
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js'
import {UnrealBloomPass} from '/jsm/postprocessing/UnrealBloomPass.js'
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';



export class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private raindropMaterial: THREE.ShaderMaterial;

  private controls: OrbitControls;
  private composer: EffectComposer;
  
  private lampLightIntensity;

  // TODO: add water & particle system here.

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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

    const pointLightRight = new THREE.PointLight(0xf6f5af);
    pointLightRight.position.set(1.84, 2.08, 8.7);
    this.scene.add(pointLightRight);
    pointLightRight.color.set(0xe2af6c);
    pointLightRight.intensity = this.lampLightIntensity;
    pointLightRight.decay = 0.7;
    pointLightRight.distance = 18;


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

  private init_rain(){

    const rainVertexShader = `
      uniform float uCount;
      uniform float uTime;
      uniform float uMaxSpeed;
      uniform vec3 uPointLightPositions[NUM_POINT_LIGHTS]; // positions of the two point light sources in the light bulbs
      
      attribute vec2 aRandom; // just random number between 0~1

      varying vec3 raindropPosition;


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

        int lightIndex = int(floor(rand(fract(aRandom + fallNumRand + 0.34)) * float(NUM_POINT_LIGHTS)));
        vec3 lightPosition = uPointLightPositions[lightIndex];
      
        raindropPosition = vec3(
          mix(-3.431, 4.918, aRandom.x),    // edge coordinates of the entire pool scene bounding box 
          raindropPositionY,
          mix(-8.392, 10.435, aRandom.y)    // edge coordinates of the entire pool scene bounding box 
        );


        float distPerFrame = (speed) / 60.0;
      
        vec4 mvPosition = vec4(position, 1.0);
        mvPosition = modelViewMatrix 
          * translationMatrix(lightPosition)
          * translationMatrix(-lightPosition)
          * translationMatrix(raindropPosition)
          * scaleMatrix(vec3(size, distPerFrame, size))
          * mvPosition;
    
      
        gl_Position = projectionMatrix * mvPosition;
      }`;
    
    const rainFragmentShader = `
    uniform float uLightFactor;
    uniform vec3 uPointLightPositions[NUM_POINT_LIGHTS];
    varying vec3 raindropPosition;
    
    void main() {
      vec4 diffuseColor = vec4(1.0);
    
      float lightIntensityOnRaindrop = uLightFactor;

      float distanceFromPointLight0 = distance(raindropPosition, uPointLightPositions[0]);  
      float distanceFromPointLight1 = distance(raindropPosition, uPointLightPositions[1]);

    //   float intensity0 = 1.0 / (1.0 + distanceFromPointLight0); 
    //   float intensity1 = 1.0 / (1.0 + distanceFromPointLight1);
      float intensity0 = exp(-distanceFromPointLight0 * 0.2) / 2.0;   // lower intensity as further away from point light sources
      float intensity1 = exp(-distanceFromPointLight1 * 0.2) / 2.0;
        
      float combinedIntensity = (intensity0 + intensity1);  // This part is to make sure that raindrops further away from the bulb has loweri ntensity.

    
      vec4 finalColor = vec4(diffuseColor.rgb * lightIntensityOnRaindrop * combinedIntensity, diffuseColor.a);
      gl_FragColor = finalColor;
    }`;

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
