import * as THREE from "/build/three.module.js";

import { Pass } from "./pass.js";

export class RefractionPass extends Pass<THREE.PerspectiveCamera, [THREE.Texture, THREE.DepthTexture]> {
  constructor(camera: THREE.PerspectiveCamera) {
    super();
    this.camera = camera; // Reuse the same camera
    this.target.depthTexture = new THREE.DepthTexture(undefined, undefined);
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): [THREE.Texture, THREE.DepthTexture] {
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);

    return [this.target.texture, this.target.depthTexture];
  }
}
