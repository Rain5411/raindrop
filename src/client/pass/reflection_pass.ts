import * as THREE from "/build/three.module.js";

import { Pass } from "./pass.js";

export class ReflectionPass extends Pass<THREE.PerspectiveCamera, THREE.Texture> {
  private plane: THREE.Plane;

  constructor(camera: THREE.PerspectiveCamera, plane: THREE.Plane, to: THREE.Vector3) {
    super();
    this.camera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
    this.plane = plane;
    this.update_camera(camera, to);
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    renderer.clippingPlanes = [ this.plane ];
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);
    renderer.clippingPlanes = [];

    return this.target.texture;
  }

  public update_camera(camera: THREE.PerspectiveCamera, to: THREE.Vector3) {
    const project = new THREE.Vector3();
    this.plane.projectPoint(camera.position, project);
    const delta = project.sub(camera.position).multiplyScalar(2.0);
    const target = camera.position.clone().add(delta);
    this.camera.position.set(target.x, target.y, target.z);

    const project2 = new THREE.Vector3();
    this.plane.projectPoint(to, project2);
    const delta2 = project2.sub(to).multiplyScalar(2.0);
    const target2 = to.add(delta2);
    this.camera.lookAt(new THREE.Vector3(target2.x, target2.y, target2.z));
  }
}
