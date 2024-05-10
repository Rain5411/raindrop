import * as THREE from "/build/three.module.js";
import { Pass } from "./pass.js";

export class ReflectionPass extends Pass<THREE.PerspectiveCamera, THREE.Texture> {
  private plane: THREE.Plane; // * we simply assume that the normal direction is always up.

  constructor(camera: THREE.PerspectiveCamera, plane: THREE.Plane, to: THREE.Vector3) {
    super();
    // * copy the basic information of the main camera
    this.camera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
    this.plane = plane;
    this.updateCamera(camera, to);
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    renderer.clippingPlanes = [ this.plane ]; // * only sample things above the water surface
    super.render(renderer, scene);
    renderer.clippingPlanes = [];

    return this.target.texture;
  }

  /**
   * mirror the given vertex based on the plane. 
   */
  private mirror(v: THREE.Vector3): THREE.Vector3 {
    const project = new THREE.Vector3();
    this.plane.projectPoint(v, project);
    const delta = project.sub(v).multiplyScalar(2.0);
    return v.clone().add(delta);
  }

  public updateCamera(camera: THREE.PerspectiveCamera, to: THREE.Vector3) {
    const mirroredCameraPos = this.mirror(camera.position);
    this.camera.position.set(mirroredCameraPos.x, mirroredCameraPos.y, mirroredCameraPos.z);
    const mirroredTo = this.mirror(to);
    this.camera.lookAt(new THREE.Vector3(mirroredTo.x, mirroredTo.y, mirroredTo.z));
  }
}
