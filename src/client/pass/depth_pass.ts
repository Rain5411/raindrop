import * as THREE from "/build/three.module.js";

export type AABB = [THREE.Vector3, THREE.Vector3];

export class DepthPass {
  private camera: THREE.OrthographicCamera;
  private target: THREE.WebGLRenderTarget;
  private texture: THREE.DepthTexture;

  constructor(box: AABB) {
    this.camera = new THREE.OrthographicCamera(box[1].z, box[0].z, box[0].x, box[1].x, box[1].y, box[0].y);
    this.camera.position.y = 3;
    this.camera.lookAt(new THREE.Vector3(0, -1, 0));

    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.target.depthBuffer = true;
    this.texture = new THREE.DepthTexture(Math.abs(box[1].z - box[0].z) * 10, Math.abs(box[1].x - box[0].x) * 10);
    this.texture.format = THREE.DepthFormat;
    this.texture.type = THREE.UnsignedIntType;
    this.target.texture.format = THREE.RGBAFormat;
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.stencilBuffer = false;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.depthTexture = this.texture;
  }

  public get_texture(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.DepthTexture {
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);

    return this.texture;
  }
}
