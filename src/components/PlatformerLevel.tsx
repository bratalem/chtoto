import { useEffect, useMemo, useRef, useState } from 'react';
import levelImage from '../assets/whispering-oaks-level.png';
import { updatePlatformerPlayer } from '../lib/platformerPhysics';
import type { PlatformerInput, PlatformerPlayer, Rect } from '../lib/platformerPhysics';

type AnimationName = 'idle' | 'run' | 'jump';

type PlatformerLevelProps = {
  onBackToMenu?: () => void;
};

const levelWidth = 512;
const viewportWidth = 256;

const initialPlayer: PlatformerPlayer = {
  x: 32,
  y: 75,
  vx: 0,
  vy: 0,
  width: 16,
  height: 30,
  facing: 1,
  grounded: false,
};

const colliders: Rect[] = [
  { x: 0, y: 105, width: 512, height: 23 },
  { x: 18, y: 58, width: 45, height: 47 },
  { x: 96, y: 66, width: 356, height: 8 },
  { x: 96, y: 23, width: 8, height: 82 },
  { x: 444, y: 23, width: 8, height: 82 },
  { x: 346, y: 78, width: 140, height: 34 },
];

function animationFor(player: PlatformerPlayer): AnimationName {
  if (!player.grounded) return 'jump';
  if (Math.abs(player.vx) > 1) return 'run';
  return 'idle';
}

export function PlatformerLevel({ onBackToMenu }: PlatformerLevelProps) {
  const keys = useRef(new Set<string>());
  const jumpLock = useRef(false);
  const player = useRef<PlatformerPlayer>(initialPlayer);
  const camera = useRef(0);
  const [renderState, setRenderState] = useState({ player: initialPlayer, cameraX: 0 });
  const collisionGuides = useMemo(() => colliders.filter((collider) => collider.y < 105), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      keys.current.delete(event.code);
      if (event.code === 'Space') jumpLock.current = false;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame = 0;
    let lastTick = performance.now();
    function tick() {
      const now = performance.now();
      const delta = Math.min(0.033, (now - lastTick) / 1000);
      lastTick = now;
      const wantsJump = keys.current.has('Space') && !jumpLock.current;
      const input: PlatformerInput = {
        left: keys.current.has('KeyA') || keys.current.has('ArrowLeft'),
        right: keys.current.has('KeyD') || keys.current.has('ArrowRight'),
        jump: wantsJump,
      };

      if (wantsJump) jumpLock.current = true;
      player.current = updatePlatformerPlayer(player.current, input, colliders, delta);
      const targetCamera = Math.max(0, Math.min(levelWidth - viewportWidth, player.current.x - viewportWidth * 0.45));
      camera.current += (targetCamera - camera.current) * Math.min(1, delta * 7.5);
      setRenderState({ player: player.current, cameraX: camera.current });
      frame = window.requestAnimationFrame(tick);
    }

    tick();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const animation = animationFor(renderState.player);

  return (
    <section className="platformer-screen" aria-label="Whispering Oaks platformer level">
      <div className="platformer-viewport">
        <div className="platformer-camera" style={{ transform: `translate3d(${-renderState.cameraX}px, 0, 0)` }}>
          <img className="platformer-level-map" src={levelImage} alt="" draggable={false} />
          {collisionGuides.map((collider) => (
            <span
              className="platformer-collider"
              key={`${collider.x}-${collider.y}`}
              style={{ left: collider.x, top: collider.y, width: collider.width, height: collider.height }}
            />
          ))}
          <span
            aria-label="Survivor"
            className={`platformer-player platformer-player-${animation}`}
            style={{
              left: renderState.player.x,
              top: renderState.player.y,
              transform: `scaleX(${renderState.player.facing})`,
            }}
          >
            <span className="pixel-survivor-backpack" />
            <span className="pixel-survivor-head" />
            <span className="pixel-survivor-body" />
            <span className="pixel-survivor-arm pixel-survivor-arm-back" />
            <span className="pixel-survivor-arm pixel-survivor-arm-front" />
            <span className="pixel-survivor-crowbar" />
            <span className="pixel-survivor-leg pixel-survivor-leg-back" />
            <span className="pixel-survivor-leg pixel-survivor-leg-front" />
          </span>
        </div>
      </div>
      <div className="platformer-hud">
        <span>A/D or arrows - move</span>
        <span>Space - jump</span>
        <span>{animation.toUpperCase()}</span>
      </div>
      {onBackToMenu && (
        <button className="platformer-menu-button" type="button" onClick={onBackToMenu}>
          Menu
        </button>
      )}
    </section>
  );
}
