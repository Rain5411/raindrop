import * as THREE from "/build/three.module.js";
import { Pass } from "./pass.js";

export class RefractionPass extends Pass<THREE.PerspectiveCamera, [THREE.Texture, THREE.DepthTexture]> {
  constructor(camera: THREE.PerspectiveCamera) {
    super();
    this.camera = camera; // * reuse the same camera
    this.enableDepthTexture();
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): [THREE.Texture, THREE.DepthTexture] {
    super.render(renderer, scene);
    return [this.target.texture, this.target.depthTexture];
  }
}
