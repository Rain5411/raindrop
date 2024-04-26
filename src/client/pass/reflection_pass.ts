import * as THREE from "/build/three.module.js";

export class ReflectionPass {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.WebGLRenderTarget;
  private plane: THREE.Plane;

  constructor(camera: THREE.PerspectiveCamera, plane: THREE.Plane) {
    this.camera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
    this.plane = plane;
    this.update_camera(camera);

    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.target.texture.format = THREE.RGBAFormat;
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthBuffer = true;
  }

  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    renderer.clippingPlanes = [ this.plane ];
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);
    renderer.clippingPlanes = [];

    return this.target.texture;
  }

  public update_camera(camera: THREE.PerspectiveCamera) {
    const project = new THREE.Vector3();
    this.plane.projectPoint(camera.position, project);
    const delta = project.sub(camera.position).multiplyScalar(2.0);
    const target = camera.position.clone();
    target.add(delta);
    this.camera.position.set(target.x, target.y, target.z);

    let view = new THREE.Vector3();
    this.camera.getWorldDirection(view);
    this.camera.lookAt(view);
  }
}
