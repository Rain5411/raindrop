import * as THREE from "/build/three.module.js";
import { GLTFLoader } from "/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "/jsm/controls/OrbitControls.js";

export class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sunlight: THREE.DirectionalLight;
  private controls: OrbitControls;

  // TODO: add water & particle system here.

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 32768);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.load_scene();
    this.set_camera();
  }

  private load_scene() {
    const loader = new GLTFLoader();
    const self = this;

    loader.load("/model.glb", (data) => {
      const models = data.scene;
      models.position.set(0, 0, 0);

      self.scene.add(models);
    }, undefined, (err) => { console.error(err); });

    this.sunlight = new THREE.DirectionalLight();
    this.sunlight.position.set(1, 1, 0.5);
    this.scene.add(this.sunlight);
  }

  private set_camera() {
    this.camera.position.set(0, 0, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.listenToKeyEvents( window );
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.screenSpacePanning = false;
		this.controls.minDistance = 0.1;
		this.controls.maxDistance = 8;
		this.controls.maxPolarAngle = Math.PI / 2;
  }

  public update() {
    requestAnimationFrame(this.update.bind(this));
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public set_sunlight(dir: [number, number, number], intensity: number) {
    const dir_v = new THREE.Vector3(dir[0], dir[1], dir[2]);

    // TODO:
  }

  public switch_lamp() {
    // TODO:
  }
}
