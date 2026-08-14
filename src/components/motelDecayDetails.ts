import * as THREE from 'three';

const rust = new THREE.MeshStandardMaterial({ color: '#7a3e24', roughness: 0.95, metalness: 0.35 });
const darkGlass = new THREE.MeshStandardMaterial({ color: '#10161a', roughness: 0.55, metalness: 0.05 });
const brokenGlass = new THREE.MeshStandardMaterial({ color: '#7f9aa3', roughness: 0.28, metalness: 0.2 });
const wood = new THREE.MeshStandardMaterial({ color: '#5a3c26', roughness: 0.92 });
const crackedPaint = new THREE.MeshStandardMaterial({ color: '#4b5558', roughness: 0.88 });
const barePlaster = new THREE.MeshStandardMaterial({ color: '#b6afa3', roughness: 0.96 });
const crack = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 1 });

function addBox(scene: THREE.Scene, size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addPipe(scene: THREE.Scene, position: [number, number, number], length: number, axis: 'x' | 'z', tilt = 0) {
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, length, 12), rust);
  pipe.position.set(...position);
  pipe.castShadow = true;
  pipe.receiveShadow = true;
  pipe.rotation.z = axis === 'x' ? Math.PI / 2 + tilt : tilt;
  pipe.rotation.x = axis === 'z' ? Math.PI / 2 + tilt : 0;
  scene.add(pipe);
}

function addBrokenPipe(scene: THREE.Scene, position: [number, number, number], axis: 'x' | 'z') {
  addPipe(scene, [position[0] - 0.55, position[1], position[2]], 0.9, axis, 0.18);
  addPipe(scene, [position[0] + 0.55, position[1] - 0.18, position[2]], 0.8, axis, -0.24);
  addBox(scene, [0.18, 0.18, 0.18], position, rust);
}

function addFrontWindow(scene: THREE.Scene, x: number, y: number, isBoarded: boolean) {
  addBox(scene, [1.2, 0.82, 0.08], [x, y, -7.72], darkGlass);
  if (isBoarded) {
    for (const offset of [-0.26, 0, 0.26]) {
      const board = addBox(scene, [1.45, 0.12, 0.12], [x, y + offset, -7.62], wood);
      board.rotation.z = offset === 0 ? -0.12 : 0.08;
    }
    return;
  }

  addBox(scene, [0.5, 0.08, 0.1], [x - 0.32, y + 0.18, -7.59], brokenGlass);
  addBox(scene, [0.1, 0.48, 0.1], [x + 0.28, y - 0.08, -7.59], brokenGlass);
  addBox(scene, [0.16, 0.16, 0.08], [x + 0.45, y + 0.32, -7.58], brokenGlass);
}

function addSideWindow(scene: THREE.Scene, x: number, z: number, y: number, isBoarded: boolean) {
  addBox(scene, [0.08, 0.82, 1.2], [x, y, z], darkGlass);
  if (isBoarded) {
    for (const offset of [-0.28, 0.28]) {
      const board = addBox(scene, [0.12, 0.12, 1.55], [x, y + offset, z], wood);
      board.rotation.x = offset > 0 ? 0.12 : -0.12;
    }
    return;
  }

  addBox(scene, [0.1, 0.08, 0.56], [x, y + 0.18, z - 0.28], brokenGlass);
  addBox(scene, [0.1, 0.46, 0.1], [x, y - 0.06, z + 0.32], brokenGlass);
}

function addRottenDoor(scene: THREE.Scene, position: [number, number, number], side: 'front' | 'left' | 'right', broken: boolean) {
  const size: [number, number, number] = side === 'front' ? [1, 1.55, 0.08] : [0.08, 1.55, 1];
  const door = addBox(scene, size, position, crackedPaint);
  door.rotation.y = broken ? (side === 'left' ? -0.28 : 0.22) : 0;
  if (broken) door.position.y -= 0.12;

  const paintAxisSize: [number, number, number] = side === 'front' ? [0.42, 0.12, 0.09] : [0.09, 0.12, 0.42];
  addBox(scene, paintAxisSize, [position[0], position[1] + 0.32, position[2]], barePlaster);
  addBox(scene, paintAxisSize, [position[0], position[1] - 0.38, position[2]], barePlaster);
}

function addWallDamage(scene: THREE.Scene) {
  const frontCracks: [number, number, number, number][] = [[-10, 2.1, 0.12, 1.4], [-2, 4.2, 0.1, 1.1], [8, 1.65, 0.1, 1.25]];
  frontCracks.forEach(([x, y, width, height]) => {
    const mesh = addBox(scene, [width, height, 0.06], [x, y, -7.68], crack);
    mesh.rotation.z = x > 0 ? 0.36 : -0.28;
  });

  for (const [x, y, z] of [[-6, 2.6, -7.66], [5.5, 4.55, -7.66], [-17.95, 2.2, 2.8], [17.95, 3.8, -1.2]]) {
    addBox(scene, [1.3, 0.7, 0.08], [x, y, z], barePlaster);
  }
}

export function addMotelDecayDetails(scene: THREE.Scene) {
  addPipe(scene, [0, 2.25, -7.45], 24, 'x', 0.03);
  addBrokenPipe(scene, [8.2, 2.08, -7.45], 'x');
  addPipe(scene, [-14.3, 2.2, 1.8], 13, 'z', -0.08);
  addPipe(scene, [14.3, 2.15, 1.8], 13, 'z', 0.07);
  addBrokenPipe(scene, [-14.3, 1.9, 4.7], 'z');

  for (const x of [-10, -6, -2, 2, 6, 10]) {
    addFrontWindow(scene, x, 1.9, x === -6 || x === 6);
    addFrontWindow(scene, x, 4.75, x === -2 || x === 10);
  }

  for (const z of [-4, 0, 4]) {
    addSideWindow(scene, -15.72, z, 1.9, z === 0);
    addSideWindow(scene, 15.72, z, 4.75, z === -4);
  }

  for (const x of [-12, -8, -4, 0, 4, 8, 12]) {
    addRottenDoor(scene, [x, 0.9, -7.58], 'front', x === -8 || x === 8);
    addRottenDoor(scene, [x, 3.75, -7.58], 'front', x === -4 || x === 12);
  }

  addRottenDoor(scene, [-15.58, 0.9, 0.5], 'left', true);
  addRottenDoor(scene, [15.58, 3.75, 4.5], 'right', true);
  addWallDamage(scene);
}
