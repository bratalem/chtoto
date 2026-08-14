import * as THREE from 'three';

const rustStain = new THREE.MeshStandardMaterial({ color: '#522717', roughness: 1 });
const mold = new THREE.MeshStandardMaterial({ color: '#253829', roughness: 1 });
const grime = new THREE.MeshStandardMaterial({ color: '#2a2a25', roughness: 1 });
const wetPatch = new THREE.MeshStandardMaterial({ color: '#080b0d', roughness: 0.22, metalness: 0.06 });
const graffitiRed = new THREE.MeshStandardMaterial({ color: '#70151f', roughness: 0.78 });
const graffitiPale = new THREE.MeshStandardMaterial({ color: '#b8b0a0', roughness: 0.82 });

function addBox(scene: THREE.Scene, size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addWallPatch(scene: THREE.Scene, x: number, y: number, z: number, width: number, height: number, material: THREE.Material) {
  const patch = addBox(scene, [width, height, 0.035], [x, y, z], material);
  patch.rotation.z = (x + y) * 0.04;
  return patch;
}

function addRustRuns(scene: THREE.Scene) {
  for (const x of [-11.5, -8.2, -3.4, 2.2, 7.8, 10.8]) {
    addWallPatch(scene, x, 1.75, -7.54, 0.28, 1.2, rustStain);
    addWallPatch(scene, x + 0.32, 1.25, -7.53, 0.16, 0.8, rustStain);
  }

  for (const [x, z] of [[-15.5, -3.2], [-15.5, 3.5], [15.5, -1.4], [15.5, 4.2]]) {
    const run = addBox(scene, [0.035, 1.1, 0.28], [x, 1.58, z], rustStain);
    run.rotation.z = x < 0 ? -0.08 : 0.08;
  }
}

function addConcreteDirt(scene: THREE.Scene) {
  for (const x of [-12, -6, 0, 6, 12]) {
    addWallPatch(scene, x, 0.9, -7.53, 2.2, 0.42, grime);
    addWallPatch(scene, x + 1, 4.85, -7.53, 1.55, 0.48, mold);
  }

  addBox(scene, [0.035, 1.2, 5.8], [-15.52, 0.95, 1.8], grime);
  addBox(scene, [0.035, 1.4, 4.8], [15.52, 1.2, 2.4], grime);
  addBox(scene, [0.035, 0.72, 4.6], [-15.52, 4.75, -0.3], mold);
  addBox(scene, [0.035, 0.72, 4.3], [15.52, 4.7, 0.6], mold);
}

function addWetAsphalt(scene: THREE.Scene) {
  for (const [x, z, width, depth] of [[-9, 9, 5, 2.2], [2.5, 8.4, 4.2, 1.6], [9, 7.2, 3.5, 1.4], [-2, 5.8, 2.6, 1]]) {
    const patch = addBox(scene, [width, 0.025, depth], [x, 0.035, z], wetPatch);
    patch.rotation.y = x * 0.04;
  }
}

function addGraffiti(scene: THREE.Scene) {
  const motelLetters = [
    [-5.8, 2.7, 0.12, 0.8],
    [-5.35, 2.7, 0.12, 0.8],
    [-4.9, 2.7, 0.12, 0.8],
    [-4.45, 2.7, 0.12, 0.8],
  ] as const;
  motelLetters.forEach(([x, y, width, height]) => addWallPatch(scene, x, y, -7.51, width, height, graffitiRed));
  addWallPatch(scene, -4.9, 2.28, -7.5, 1.25, 0.12, graffitiRed);

  const slash = addWallPatch(scene, 9.8, 2.75, -7.5, 1.6, 0.12, graffitiPale);
  slash.rotation.z = -0.55;
  addWallPatch(scene, 10.2, 2.35, -7.5, 1.05, 0.1, graffitiPale).rotation.z = 0.42;
}

export function addMotelHorrorTextures(scene: THREE.Scene) {
  addRustRuns(scene);
  addConcreteDirt(scene);
  addWetAsphalt(scene);
  addGraffiti(scene);
}
