import * as THREE from "/build/three.module.js";
import { Pass } from "./pass.js";

export type AABB = [THREE.Vector3, THREE.Vector3];

export class DepthPass extends Pass<THREE.OrthographicCamera, THREE.DepthTexture> {
  /**
   * @param box AABB of the whole model (including rain)
   */
  constructor(box: AABB) {
    super();
    const center = new THREE.Vector3((box[0].x + box[1].x) / 2, (box[0].y + box[1].y) / 2, (box[0].z + box[1].z) / 2);
    // * (-0.5w, 0.5w), (-0.5h, 0.5h), (1, depth + 1)
    this.camera = new THREE.OrthographicCamera(-(box[1].x - box[0].x) / 2, (box[1].x - box[0].x) / 2,
      (box[1].z - box[0].z) / 2, -(box[1].z - box[0].z) / 2, 1, box[1].y - box[0].y + 1);
    this.camera.position.set(center.x, box[1].y, center.z);
    this.camera.lookAt(center);
    this.enableDepthTexture();
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.DepthTexture {
    super.render(renderer, scene);
    return this.target.depthTexture;
  }
}
