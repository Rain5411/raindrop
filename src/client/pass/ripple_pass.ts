import * as THREE from "/build/three.module.js";

import { AABB } from "./depth_pass.js";
import { Pass } from "./pass.js";

export class RipplePass extends Pass<THREE.OrthographicCamera, THREE.Texture> {
  private drop_material: THREE.ShaderMaterial;
  private ripple_material: THREE.ShaderMaterial;
  private raindrop: THREE.Mesh;
  private water_plane: THREE.Mesh;

  constructor(box: AABB, rainrop: THREE.Mesh, water_plane: THREE.Mesh) {
    super();
    this.raindrop = rainrop;
    this.water_plane = water_plane;
    
    const center = new THREE.Vector3((box[0].x + box[1].x) / 2, (box[0].y + box[1].y) / 2, (box[0].z + box[1].z) / 2);
    this.camera = new THREE.OrthographicCamera(-(box[1].x - box[0].x) / 2, (box[1].x - box[0].x) / 2,
      (box[1].z - box[0].z) / 2, -(box[1].z - box[0].z) / 2, 1, box[1].y - box[0].y + 1);
    this.camera.position.set(center.x, box[1].y, center.z);
    this.camera.lookAt(center);

    // TODO: shaders
    this.drop_material = new THREE.ShaderMaterial();
    this.ripple_material = new THREE.ShaderMaterial();
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    // get the raindrop position texture
    const rain_material = this.raindrop.material;
    this.raindrop.material = this.drop_material;
    renderer.setRenderTarget(this.target);
    renderer.render(this.raindrop, this.camera);
    const raidrop_texture = this.target.texture;
    this.raindrop.material = rain_material;

    // iteration
    const water_material = this.water_plane.material;
    this.water_plane.material = this.ripple_material;
    let height_texture: THREE.Texture = null;

    for (let i = 0; i < 8; ++i) {
      // TODO: update uniforms
      renderer.setRenderTarget(this.target);
      renderer.render(scene, this.camera);
      height_texture = this.target.texture;
    }

    this.water_plane.material = water_material;
    renderer.setRenderTarget(null);

    return height_texture;
  }
}
