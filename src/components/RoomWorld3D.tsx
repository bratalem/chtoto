import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildMotelWorld } from './buildMotelWorld';
import type { Collider } from './buildMotelWorld';

type RoomWorld3DProps = {
  isStalkerVisible: boolean;
  isCorridorOpen: boolean;
  isFlashlightActive: boolean;
  isFlashlightFlickering: boolean;
};

function keepInsideMap(position: THREE.Vector3) {
  position.x = THREE.MathUtils.clamp(position.x, -18.5, 18.5);
  position.z = THREE.MathUtils.clamp(position.z, -12.5, 13.5);
}

function hitsCollider(position: THREE.Vector3, colliders: Collider[]) {
  const radius = 0.28;
  return colliders.some(
    (collider) =>
      position.x > collider.minX - radius &&
      position.x < collider.maxX + radius &&
      position.z > collider.minZ - radius &&
      position.z < collider.maxZ + radius,
  );
}

export function RoomWorld3D({ isFlashlightActive, isFlashlightFlickering }: RoomWorld3DProps) {
  const mount = useRef<HTMLDivElement | null>(null);
  const state = useRef({
    keys: new Set<string>(),
    yaw: 0,
    pitch: -0.08,
    flashlight: null as THREE.SpotLight | null,
    isFlashlightActive,
    isFlashlightFlickering,
  });

  useEffect(() => {
    const root = mount.current;
    if (!root) return;
    const rootElement = root;

    const scene = new THREE.Scene();
    const { colliders, flickerLights } = buildMotelWorld(scene);

    const camera = new THREE.PerspectiveCamera(68, rootElement.clientWidth / rootElement.clientHeight, 0.1, 80);
    camera.position.set(0, 1.55, 7.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rootElement.clientWidth, rootElement.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.72;
    rootElement.appendChild(renderer.domElement);

    const flashlight = new THREE.SpotLight('#fff1d7', isFlashlightActive ? 8 : 1.1, 12, Math.PI / 5, 0.55, 1);
    flashlight.position.copy(camera.position);
    flashlight.target.position.set(0, 1.4, 2);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.set(1024, 1024);
    scene.add(flashlight, flashlight.target);
    state.current.flashlight = flashlight;

    function handleKeyDown(event: KeyboardEvent) {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
        state.current.keys.add(event.code);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      state.current.keys.delete(event.code);
    }

    function handleMouseMove(event: MouseEvent) {
      if (document.pointerLockElement !== rootElement) return;
      state.current.yaw += event.movementX * 0.0022;
      state.current.pitch = THREE.MathUtils.clamp(state.current.pitch - event.movementY * 0.0022, -1.45, 1.45);
    }

    function handlePointerDown() {
      rootElement.requestPointerLock();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    rootElement.addEventListener('pointerdown', handlePointerDown);

    let frame = 0;
    let lastTick = performance.now();
    function animate() {
      const now = performance.now();
      const delta = Math.min(0.04, (now - lastTick) / 1000);
      lastTick = now;

      const forward = new THREE.Vector3(Math.sin(state.current.yaw), 0, -Math.cos(state.current.yaw));
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      const move = new THREE.Vector3();
      if (state.current.keys.has('KeyW')) move.add(forward);
      if (state.current.keys.has('KeyS')) move.sub(forward);
      if (state.current.keys.has('KeyD')) move.add(right);
      if (state.current.keys.has('KeyA')) move.sub(right);

      if (move.lengthSq() > 0) {
        const previousPosition = camera.position.clone();
        camera.position.add(move.normalize().multiplyScalar(3.2 * delta));
        keepInsideMap(camera.position);
        if (hitsCollider(camera.position, colliders)) camera.position.copy(previousPosition);
      }

      flickerLights.forEach((light, index) => {
        const pulse = Math.sin(now * 0.0022 + index * 2.1);
        const dropout = Math.sin(now * 0.011 + index) > 0.92 ? 0.08 : 1;
        light.intensity = (0.12 + Math.max(0, pulse) * 0.42) * dropout;
      });

      const lookDirection = new THREE.Vector3(
        Math.sin(state.current.yaw) * Math.cos(state.current.pitch),
        Math.sin(state.current.pitch),
        -Math.cos(state.current.yaw) * Math.cos(state.current.pitch),
      );
      const lookTarget = camera.position.clone().add(lookDirection);
      camera.lookAt(lookTarget);
      flashlight.position.copy(camera.position);
      flashlight.target.position.copy(lookTarget);
      flashlight.intensity = state.current.isFlashlightActive ? (state.current.isFlashlightFlickering ? 2.5 : 8) : 1.1;

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    }
    animate();

    function resize() {
      camera.aspect = rootElement.clientWidth / rootElement.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(rootElement.clientWidth, rootElement.clientHeight);
    }

    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      rootElement.removeEventListener('pointerdown', handlePointerDown);
      rootElement.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    state.current.isFlashlightActive = isFlashlightActive;
    state.current.isFlashlightFlickering = isFlashlightFlickering;
  }, [isFlashlightActive, isFlashlightFlickering]);

  return <div className="room-world-3d" ref={mount} />;
}
