import * as THREE from 'three';
import { addMotelCourtyardProps } from './motelCourtyardProps';
import { addMotelDecayDetails } from './motelDecayDetails';
import { addMotelHorrorTextures } from './motelHorrorTextures';

export type Collider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const concrete = new THREE.MeshStandardMaterial({ color: '#7b7d7c', roughness: 0.86 });
const darkConcrete = new THREE.MeshStandardMaterial({ color: '#4d5051', roughness: 0.9 });
const asphalt = new THREE.MeshStandardMaterial({ color: '#25282a', roughness: 0.94 });
const poolVoid = new THREE.MeshStandardMaterial({ color: '#15191c', roughness: 0.82 });
const rail = new THREE.MeshStandardMaterial({ color: '#a0a2a1', roughness: 0.68 });

function addBox(
  scene: THREE.Scene,
  size: [number, number, number],
  position: [number, number, number],
  material = concrete,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addCollider(colliders: Collider[], x: number, z: number, width: number, depth: number) {
  colliders.push({
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  });
}

function addMotelWing(scene: THREE.Scene, colliders: Collider[], x: number, z: number, width: number, depth: number) {
  addBox(scene, [width, 5.2, depth], [x, 2.6, z]);
  addBox(scene, [width + 0.35, 0.28, depth + 0.35], [x, 5.35, z], darkConcrete);
  addCollider(colliders, x, z, width, depth);
}

function addBalcony(scene: THREE.Scene, x: number, z: number, width: number, depth: number) {
  addBox(scene, [width, 0.22, depth], [x, 2.85, z], darkConcrete);
  addBox(scene, [width, 0.14, 0.18], [x, 3.65, z], rail);

  const postCount = Math.max(2, Math.floor(width / 3));
  for (let index = 0; index < postCount; index += 1) {
    const postX = x - width / 2 + (index * width) / (postCount - 1);
    addBox(scene, [0.12, 0.8, 0.12], [postX, 3.28, z], rail);
  }
}

function addSideBalcony(scene: THREE.Scene, x: number, z: number, width: number, depth: number) {
  addBox(scene, [width, 0.22, depth], [x, 2.85, z], darkConcrete);
  addBox(scene, [0.18, 0.14, depth], [x, 3.65, z], rail);
  for (let index = 0; index < 5; index += 1) {
    const postZ = z - depth / 2 + (index * depth) / 4;
    addBox(scene, [0.12, 0.8, 0.12], [x, 3.28, postZ], rail);
  }
}

function addStairs(scene: THREE.Scene, x: number, z: number, direction: 1 | -1) {
  for (let step = 0; step < 9; step += 1) {
    addBox(scene, [2.4, 0.22, 0.72], [x, 0.15 + step * 0.31, z + direction * step * 0.52], darkConcrete);
  }
}

export function buildMotelWorld(scene: THREE.Scene) {
  const colliders: Collider[] = [];
  const flickerLights: THREE.PointLight[] = [];

  scene.background = new THREE.Color('#05080b');
  scene.fog = new THREE.FogExp2('#071017', 0.07);
  scene.add(new THREE.HemisphereLight('#1d3146', '#050302', 0.42));

  const moon = new THREE.DirectionalLight('#55708f', 0.36);
  moon.position.set(-8, 12, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  scene.add(moon);

  addBox(scene, [42, 0.18, 34], [0, -0.09, -1], asphalt);
  addMotelWing(scene, colliders, 0, -9.8, 30, 4);
  addMotelWing(scene, colliders, -17, 1.8, 4, 19);
  addMotelWing(scene, colliders, 17, 1.8, 4, 19);

  addBalcony(scene, 0, -6.95, 27, 2.2);
  addSideBalcony(scene, -14.05, 1.8, 2.2, 16);
  addSideBalcony(scene, 14.05, 1.8, 2.2, 16);
  addStairs(scene, -14.2, 10.8, -1);
  addStairs(scene, 14.2, 10.8, -1);

  addBox(scene, [8.6, 0.18, 4.8], [0, 0.02, 2.2], poolVoid);
  addBox(scene, [9.4, 0.22, 0.32], [0, 0.08, -0.35], darkConcrete);
  addBox(scene, [9.4, 0.22, 0.32], [0, 0.08, 4.75], darkConcrete);
  addBox(scene, [0.32, 0.22, 5.1], [-4.85, 0.08, 2.2], darkConcrete);
  addBox(scene, [0.32, 0.22, 5.1], [4.85, 0.08, 2.2], darkConcrete);
  addCollider(colliders, 0, 2.2, 9.6, 5.2);

  addMotelDecayDetails(scene);
  addMotelCourtyardProps(scene, colliders);
  addMotelHorrorTextures(scene);
  const lightPositions: [number, number, number][] = [[-12, 3.45, -6.45], [-3.5, 3.45, -6.45], [7.5, 3.45, -6.45]];
  lightPositions.forEach((position) => {
    const light = new THREE.PointLight('#b88b45', 0.35, 10);
    light.position.set(...position);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    scene.add(light);
    flickerLights.push(light);
  });

  return { colliders, flickerLights };
}
