import * as THREE from "/build/three.module.js";

import waterVertexShader from "./shaders/water_vertex.glsl";
import waterFragmentShader from "./shaders/water_frag.glsl";

import { AABB } from "./pass/depth_pass";

type HeightField = Array<Float32Array>;

const next = [[0, 1], [1, 0], [-1, 0], [0, -1]];
const damping = 0.996;
const rate = 0.005;

export class Water {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private color: THREE.Vector3;
  private size: [number, number]
  private geometry: THREE.PlaneGeometry;
  private oldh: HeightField;
  private h: HeightField;
  private newh: HeightField;
  private box: AABB;

  private dlt: number;

  constructor(scene: THREE.Scene, size: THREE.Vector2, position: THREE.Vector3) {
    const scale = 25;
    this.size = [Math.floor(scale * size.x), Math.floor(scale * size.y)];
    this.geometry = new THREE.PlaneGeometry(size.x, size.y, this.size[0] - 1, this.size[1] - 1);
    const offset = scene.getObjectByName("Tile").position;
    this.box = [
      new THREE.Vector3(position.x - size.x / 2 + offset.x, position.y - size.y / 2 + offset.z, position.z),
      new THREE.Vector3(position.x + size.x / 2 + offset.x, position.y + size.y / 2 + offset.z, position.z)
    ];
    this.color = new THREE.Vector3(0.25, 1.0, 1.25);
    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        waterColor: {
          value: this.color
        },
        opaqueTexture: {
          value: null
        },
        depthTexture: {
          value: null
        },
        reflectedTexture: {
          value: null
        }
      }
    });

    this.oldh = new Array<Float32Array>();
    this.h = new Array<Float32Array>();
    this.newh = new Array<Float32Array>();
    for (let i = 0; i < this.size[0]; ++i) {
      this.oldh[i] = new Float32Array(this.size[1]);
      this.h[i] = new Float32Array(this.size[1]);
      this.newh[i] = new Float32Array(this.size[1]);
      for (let j = 0; j < this.size[1]; ++j) {
        this.oldh[i][j] = 0;
        this.h[i][j] = 0;
        this.newh[i][j] = 0;
      }
    }

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotateX(-Math.PI / 2.0);
    scene.add(this.mesh);

  }

  public setDlt(dlt: number){
    this.dlt = dlt;
  }

  public setTextures(opaque: THREE.Texture, depth: THREE.DepthTexture, refl: THREE.Texture) {
    this.material.uniforms.opaqueTexture.value = opaque;
    this.material.uniforms.depthTexture.value = depth;
    this.material.uniforms.reflectedTexture.value = refl;
  }

  public setVisible(vis: boolean) {
    this.mesh.visible = vis;
  }

  private shallowWave() {
    for (let i = 0; i < this.size[0]; ++i) {
      for (let j = 0; j < this.size[1]; ++j) {
        this.newh[i][j] = this.h[i][j] + (this.h[i][j] - this.oldh[i][j]) * damping;

        for (let n of next) {
          const ni = i + n[0];
          const nj = j + n[1];
          if (ni >= 0 && ni < this.size[0] && nj >= 0 && nj < this.size[1]) {
            this.newh[i][j] += (this.h[ni][nj] - this.h[i][j]) * rate;
          }
        }
      }
    }

    for (let i = 0; i < this.size[0]; ++i) {
      for (let j = 0; j < this.size[1]; ++j) {
        this.oldh[i][j] = this.h[i][j];
        this.h[i][j] = this.newh[i][j];
      }
    }
  }

  public drop(drops: THREE.Vector3[], fps: number) {
    for (const dp of drops) {
      const x = Math.floor((dp.x - this.box[0].x) / (this.box[1].x - this.box[0].x) * this.size[0]);
      const y = Math.floor((dp.y - this.box[0].y) / (this.box[1].y - this.box[0].y) * this.size[1]);
      const rd = Math.random();
      if (dp.z <= 0 && rd <= 0.1 && x >= 0 && x < this.size[0] && y >= 0 && y < this.size[1]) {
    
        this.h[x][y] += this.dlt;

        let srd = 0;
        for (let n of next) {
          const nx = x + n[0];
          const ny = y + n[1];
          if (nx >= 0 && nx < this.size[0] && ny >= 0 && ny < this.size[1]) {
            ++srd;
          }
        }

        if (x > 0) {
          this.h[x - 1][y] -= this.dlt / srd;
        }
        if (x < this.size[0] - 1) {
          this.h[x + 1][y] -= this.dlt / srd;
        }
        if (y > 0) {
          this.h[x][y - 1] -= this.dlt / srd;
        }
        if (y < this.size[1] - 1) {
          this.h[x][y + 1] -= this.dlt / srd;
        }
      }
    }

    const allSteps = 240;
    for (let i = 0; i < Math.floor(allSteps / fps); ++i) {
      this.shallowWave();
    }

    const positions = this.geometry.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j < this.size[1]; ++j) {
      for (let i = 0; i < this.size[0]; ++i) {
        const id = j * this.size[0] + i;
        positions.setZ(id, this.h[i][j]);
      }
    }
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
