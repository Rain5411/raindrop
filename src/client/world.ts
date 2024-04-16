import * as THREE from "/build/three.module.js";

export class World {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private env: THREE.Mesh;

  // TODO: add water & particle system here.

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.load_scene();
  }

  private load_scene() {
    // TODO: load our scene.
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    this.env = new THREE.Mesh(geometry, material);

    this.scene.add(this.env);
    this.camera.position.z = 2;
  }

  public update() {
    requestAnimationFrame(this.update.bind(this));

    // TODO: update camera here?
    this.env.rotation.x += 0.01;
    this.env.rotation.y += 0.01;
  
    this.renderer.render(this.scene, this.camera)
  }

  public set_sunlight(dir: [number, number, number], intensity: number) {
    const dir_v = new THREE.Vector3(dir[0], dir[1], dir[2]);

    // TODO:
  }

  public switch_lamp() {
    // TODO:
  }
}
