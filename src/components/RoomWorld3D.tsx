import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ceilingStalker from '../assets/ceiling-stalker.png';

type RoomWorld3DProps = {
  isStalkerVisible: boolean;
  isCorridorOpen: boolean;
  isCorridorLightOn: boolean;
  isFlashlightActive: boolean;
  isFlashlightFlickering: boolean;
  onOpenCorridor: () => void;
  onDoorHover: (isHovered: boolean) => void;
};

export function RoomWorld3D({
  isStalkerVisible,
  isCorridorOpen,
  isCorridorLightOn,
  isFlashlightActive,
  isFlashlightFlickering,
  onOpenCorridor,
  onDoorHover,
}: RoomWorld3DProps) {
  const mount = useRef<HTMLDivElement | null>(null);
  const state = useRef({
    keys: new Set<string>(),
    mouseX: 0,
    mouseY: 0,
    stalker: null as THREE.Mesh | null,
    corridorLight: null as THREE.PointLight | null,
    flashlight: null as THREE.SpotLight | null,
    isFlashlightActive,
    isFlashlightFlickering,
  });

  useEffect(() => {
    const root = mount.current;
    if (!root) return;
    const rootElement = root;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090608');
    scene.fog = new THREE.Fog('#090608', 4, 14);

    const camera = new THREE.PerspectiveCamera(68, root.clientWidth / root.clientHeight, 0.1, 50);
    camera.position.set(0, 1.45, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rootElement.clientWidth, rootElement.clientHeight);
    rootElement.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const stalkerTexture = textureLoader.load(ceilingStalker);
    stalkerTexture.colorSpace = THREE.SRGBColorSpace;

    const floorMaterial = new THREE.MeshStandardMaterial({ color: '#201715', roughness: 0.92 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#2d2421', roughness: 0.96 });
    const darkWood = new THREE.MeshStandardMaterial({ color: '#241512', roughness: 0.88 });
    const oldWood = new THREE.MeshStandardMaterial({ color: '#3a241d', roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: '#302d2b', metalness: 0.35, roughness: 0.7 });
    const cloth = new THREE.MeshStandardMaterial({ color: '#3b070b', roughness: 0.98 });
    const glass = new THREE.MeshStandardMaterial({
      color: '#0b1724',
      emissive: '#111827',
      emissiveIntensity: 0.5,
      roughness: 0.35,
    });

    function addBox(size: [number, number, number], position: [number, number, number], material: THREE.Material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      scene.add(mesh);
      return mesh;
    }

    function addPlank(size: [number, number, number], position: [number, number, number], material = oldWood) {
      const plank = addBox(size, position, material);
      plank.rotation.z = (Math.random() - 0.5) * 0.035;
      return plank;
    }

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), wallMaterial);
    ceiling.position.y = 3;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), wallMaterial);
    backWall.position.set(0, 1.5, -4);
    scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), wallMaterial);
    frontWall.position.set(0, 1.5, 4);
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), wallMaterial);
    leftWall.position.set(-4, 1.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), wallMaterial);
    rightWall.position.set(4, 1.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    for (let index = 0; index < 11; index += 1) {
      addPlank([0.08, 0.03, 7.8], [-3.6 + index * 0.72, 0.02, 0], floorMaterial);
    }

    addBox([2.35, 0.24, 1.15], [-2.05, 0.5, 1.75], darkWood);
    addBox([2.18, 0.22, 1], [-2.05, 0.72, 1.75], cloth);
    addBox([0.55, 0.18, 0.9], [-2.85, 0.9, 1.75], new THREE.MeshStandardMaterial({ color: '#1d1514', roughness: 1 }));
    addBox([0.12, 0.72, 0.12], [-3.1, 0.36, 1.2], oldWood);
    addBox([0.12, 0.72, 0.12], [-1, 0.36, 1.2], oldWood);
    addBox([0.12, 0.72, 0.12], [-3.1, 0.36, 2.3], oldWood);
    addBox([0.12, 0.72, 0.12], [-1, 0.36, 2.3], oldWood);

    addBox([1.8, 1.25, 0.08], [-1.9, 1.72, -3.94], darkWood);
    addBox([1.48, 0.95, 0.09], [-1.9, 1.72, -3.88], glass);
    addBox([0.08, 1.18, 0.12], [-1.9, 1.72, -3.82], darkWood);
    addBox([1.62, 0.08, 0.12], [-1.9, 1.72, -3.81], darkWood);
    addBox([1.95, 0.16, 0.28], [-1.9, 1.02, -3.7], oldWood);

    addBox([1.18, 2.25, 0.12], [2.2, 1.12, -3.9], darkWood);
    addBox([0.95, 1.9, 0.08], [2.2, 1.05, -3.82], oldWood);
    addBox([0.08, 0.08, 0.08], [2.62, 1.08, -3.72], metal);

    addBox([0.16, 2.7, 0.16], [3.25, 1.35, -3.5], metal);
    addBox([0.16, 2.6, 0.16], [3.25, 1.3, -0.9], metal);
    addBox([0.16, 0.16, 2.7], [3.25, 2.6, -2.2], metal);
    addBox([0.1, 0.5, 0.1], [3.25, 2.22, -1.35], metal);

    addBox([0.9, 1.45, 0.1], [0.15, 1.7, -3.86], new THREE.MeshStandardMaterial({ color: '#140e0d', roughness: 0.92 }));
    addBox([1.05, 0.08, 0.12], [0.15, 2.48, -3.78], oldWood);
    addBox([1.05, 0.08, 0.12], [0.15, 0.92, -3.78], oldWood);

    addBox([0.8, 1.25, 0.18], [3.5, 0.62, 1.8], oldWood);
    addBox([0.5, 0.16, 0.2], [3.5, 1.35, 1.8], darkWood);
    addBox([0.18, 0.9, 0.18], [3.2, 0.45, 1.8], darkWood);
    addBox([0.18, 0.9, 0.18], [3.8, 0.45, 1.8], darkWood);

    for (let index = 0; index < 7; index += 1) {
      addBox([0.06, 0.5 + index * 0.08, 0.04], [-3.92, 0.75 + index * 0.06, -2.8 + index * 0.75], metal);
    }

    const stalker = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: stalkerTexture, transparent: true }),
    );
    stalker.position.set(0.2, 2.78, -1.35);
    stalker.rotation.x = Math.PI / 2;
    stalker.visible = isStalkerVisible;
    scene.add(stalker);
    state.current.stalker = stalker;

    const ambient = new THREE.AmbientLight('#5b433c', 0.28);
    scene.add(ambient);

    const corridorLight = new THREE.PointLight('#f8e6bd', isCorridorLightOn ? 2 : 0.15, 6);
    corridorLight.position.set(2.2, 1.6, -3.2);
    scene.add(corridorLight);
    state.current.corridorLight = corridorLight;

    const flashlight = new THREE.SpotLight('#fff1d7', isFlashlightActive ? 8 : 0, 8, Math.PI / 5, 0.55, 1);
    flashlight.position.copy(camera.position);
    flashlight.target.position.set(0, 1.4, -3);
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
      const bounds = rootElement.getBoundingClientRect();
      state.current.mouseX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      state.current.mouseY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    rootElement.addEventListener('mousemove', handleMouseMove);

    let frame = 0;
    let lastTick = performance.now();
    function animate() {
      const now = performance.now();
      const delta = Math.min(0.04, (now - lastTick) / 1000);
      lastTick = now;

      const speed = 2.4 * delta;
      if (state.current.keys.has('KeyW')) camera.position.z -= speed;
      if (state.current.keys.has('KeyS')) camera.position.z += speed;
      if (state.current.keys.has('KeyA')) camera.position.x -= speed;
      if (state.current.keys.has('KeyD')) camera.position.x += speed;
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3.35, 3.35);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -3.15, 3.35);

      const lookTarget = new THREE.Vector3(state.current.mouseX * 2.2, 1.35 - state.current.mouseY * 1.2, -4);
      camera.lookAt(lookTarget);
      flashlight.position.copy(camera.position);
      flashlight.target.position.copy(lookTarget);
      flashlight.intensity = state.current.isFlashlightActive ? (state.current.isFlashlightFlickering ? 2.5 : 8) : 0;

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
      rootElement.removeEventListener('mousemove', handleMouseMove);
      rootElement.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (state.current.stalker) state.current.stalker.visible = isStalkerVisible;
  }, [isStalkerVisible]);

  useEffect(() => {
    if (state.current.corridorLight) state.current.corridorLight.intensity = isCorridorLightOn ? 2 : 0.15;
  }, [isCorridorLightOn]);

  useEffect(() => {
    state.current.isFlashlightActive = isFlashlightActive;
    state.current.isFlashlightFlickering = isFlashlightFlickering;
  }, [isFlashlightActive, isFlashlightFlickering]);

  return (
    <div className="room-world-3d" ref={mount}>
      <button
        className="door-hotspot"
        type="button"
        onClick={onOpenCorridor}
        onMouseEnter={() => onDoorHover(true)}
        onMouseLeave={() => onDoorHover(false)}
        aria-label="Заглянуть в коридор"
      />
      {isCorridorOpen && <div className={isCorridorLightOn ? 'corridor-3d-glow corridor-3d-glow-lit' : 'corridor-3d-glow'} />}
    </div>
  );
}
