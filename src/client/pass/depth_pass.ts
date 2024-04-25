import * as THREE from "/build/three.module.js";

export type AABB = [THREE.Vector3, THREE.Vector3];

export class DepthPass {
  private camera: THREE.OrthographicCamera;
  private target: THREE.WebGLRenderTarget;

  constructor(box: AABB) {
    const center = new THREE.Vector3((box[0].x + box[1].x) / 2, (box[0].y + box[1].y) / 2, (box[0].z + box[1].z) / 2);
    this.camera = new THREE.OrthographicCamera(-(box[1].x - box[0].x) / 2, (box[1].x - box[0].x) / 2,
      (box[1].z - box[0].z) / 2, -(box[1].z - box[0].z) / 2, 1, box[1].y - box[0].y + 1);
    this.camera.position.set(center.x, box[1].y, center.z);
    this.camera.lookAt(center);

    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.target.texture.format = THREE.RGBAFormat;
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthBuffer = true;
    this.target.stencilBuffer = false;
    this.target.depthTexture = new THREE.DepthTexture(undefined, undefined);
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;
  }

  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);

    return this.target.depthTexture;
  }
}
