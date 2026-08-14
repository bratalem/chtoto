import * as THREE from 'three';
import type { Collider } from './buildMotelWorld';

const dirtyWater = new THREE.MeshStandardMaterial({ color: '#263b34', roughness: 0.38, metalness: 0.05 });
const rust = new THREE.MeshStandardMaterial({ color: '#6f3a22', roughness: 0.96, metalness: 0.28 });
const burntMetal = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.9, metalness: 0.18 });
const ashMetal = new THREE.MeshStandardMaterial({ color: '#34312d', roughness: 0.88, metalness: 0.12 });
const oldFabric = new THREE.MeshStandardMaterial({ color: '#6d6558', roughness: 0.94 });
const trash = new THREE.MeshStandardMaterial({ color: '#8b8372', roughness: 0.96 });
const branch = new THREE.MeshStandardMaterial({ color: '#3f2a1b', roughness: 0.98 });
const signPaint = new THREE.MeshStandardMaterial({ color: '#8b161b', roughness: 0.86 });

function addBox(scene: THREE.Scene, size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addCylinder(scene: THREE.Scene, radius: number, height: number, position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 10), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addCollider(colliders: Collider[], x: number, z: number, width: number, depth: number) {
  colliders.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
}

function addPoolProps(scene: THREE.Scene, colliders: Collider[]) {
  addBox(scene, [8.05, 0.08, 4.25], [0, 0.16, 2.2], dirtyWater);

  const fencePosts = [-5.9, -3, 0, 3, 5.9];
  fencePosts.forEach((x, index) => {
    const post = addCylinder(scene, 0.06, 0.95, [x, 0.56, -1.25], rust);
    post.rotation.z = index % 2 === 0 ? 0.12 : -0.16;
  });
  for (const x of [-4.45, -1.5, 1.5, 4.45]) {
    const rail = addBox(scene, [2.2, 0.08, 0.08], [x, 0.88, -1.25], rust);
    rail.rotation.z = x > 0 ? -0.08 : 0.12;
  }
  addBox(scene, [0.08, 0.08, 3.3], [-5.95, 0.78, 2.2], rust).rotation.x = 0.16;
  addBox(scene, [0.08, 0.08, 3.3], [5.95, 0.78, 2.2], rust).rotation.x = -0.12;

  addSunLounger(scene, [-7.2, 0.18, 3.4], -0.28);
  addSunLounger(scene, [7.4, 0.18, 0.9], 0.34);
  addCollider(colliders, -7.2, 3.4, 2.1, 1.1);
  addCollider(colliders, 7.4, 0.9, 2.1, 1.1);
}

function addSunLounger(scene: THREE.Scene, position: [number, number, number], angle: number) {
  const base = addBox(scene, [1.85, 0.12, 0.72], position, oldFabric);
  base.rotation.y = angle;
  const back = addBox(scene, [0.7, 0.12, 0.72], [position[0] - Math.cos(angle) * 0.62, 0.42, position[2] + Math.sin(angle) * 0.62], oldFabric);
  back.rotation.y = angle;
  back.rotation.z = -0.55;
  for (const offset of [-0.38, 0.38]) {
    const leg = addBox(scene, [0.08, 0.36, 0.08], [position[0], 0.02, position[2] + offset], rust);
    leg.rotation.z = offset > 0 ? 0.2 : -0.18;
  }
}

function addBurntCar(scene: THREE.Scene, colliders: Collider[], x: number, z: number, angle: number) {
  const body = addBox(scene, [3.2, 0.72, 1.55], [x, 0.42, z], burntMetal);
  body.rotation.y = angle;
  const cabin = addBox(scene, [1.45, 0.7, 1.2], [x - Math.sin(angle) * 0.15, 1.08, z - Math.cos(angle) * 0.15], ashMetal);
  cabin.rotation.y = angle;
  addBox(scene, [1.1, 0.12, 1.3], [x + Math.cos(angle) * 0.95, 0.9, z - Math.sin(angle) * 0.95], rust).rotation.y = angle + 0.2;
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const wheel = addCylinder(scene, 0.33, 0.18, [x + end * Math.cos(angle) * 1.1 + side * Math.sin(angle) * 0.68, 0.28, z - end * Math.sin(angle) * 1.1 + side * Math.cos(angle) * 0.68], burntMetal);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  addCollider(colliders, x, z, 3.4, 1.8);
}

function addScatter(scene: THREE.Scene) {
  const suitcasePositions: [number, number, number][] = [[-8.5, 0.22, -1.5], [5.6, 0.22, 5.9], [11.4, 0.22, 6.2]];
  suitcasePositions.forEach((position, index) => {
    const bag = addBox(scene, [0.9, 0.42, 0.52], position, trash);
    bag.rotation.y = index * 0.5;
  });

  for (const [x, z, scale] of [[-3, 6.3, 1], [2.4, -1.1, 0.8], [9.2, 3.8, 0.9], [-11, 5.2, 0.7]]) {
    addBox(scene, [0.55 * scale, 0.12, 0.38 * scale], [x, 0.1, z], trash).rotation.y = x * 0.2;
    const stick = addCylinder(scene, 0.035, 1.35 * scale, [x + 0.45, 0.16, z - 0.28], branch);
    stick.rotation.z = Math.PI / 2;
    stick.rotation.y = z * 0.3;
  }
}

function addBrokenSign(scene: THREE.Scene, colliders: Collider[]) {
  const pole = addCylinder(scene, 0.13, 4.4, [-10.8, 2.1, 12.1], rust);
  pole.rotation.z = -0.1;
  const sign = addBox(scene, [4.5, 1.45, 0.18], [-10.5, 4.15, 12.15], signPaint);
  sign.rotation.z = -0.18;
  addBox(scene, [1.35, 1.48, 0.2], [-8.65, 3.93, 12.16], burntMetal).rotation.z = -0.28;
  addBox(scene, [2.1, 0.08, 0.24], [-10.8, 4.1, 12.02], rust).rotation.z = 0.2;
  addCollider(colliders, -10.8, 12.1, 1.2, 1.2);
}

export function addMotelCourtyardProps(scene: THREE.Scene, colliders: Collider[]) {
  addPoolProps(scene, colliders);
  addBurntCar(scene, colliders, -7.3, 10.6, -0.18);
  addBurntCar(scene, colliders, 0.8, 11.2, 0.08);
  addBurntCar(scene, colliders, 8.7, 10.1, 0.34);
  addScatter(scene);
  addBrokenSign(scene, colliders);
}
