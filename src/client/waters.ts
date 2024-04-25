import * as THREE from "/build/three.module.js";

import waterVertexShader from "./shaders/water_vertex.glsl";
import waterFragmentShader from "./shaders/water_frag.glsl";

const PI = 3.1415926535;

export class Water {
  private mesh: THREE.Mesh;
  private material: THREE.Material;

  constructor(scene: THREE.Scene, size: THREE.Vector2, position: THREE.Vector3) {
    const geometry = new THREE.PlaneGeometry(size.x, size.y, 100, 100);
    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotateX(-PI / 2.0);
    scene.add(this.mesh);
  }
}
