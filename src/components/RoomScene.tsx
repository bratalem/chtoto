import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import ceilingStalker from '../assets/ceiling-stalker.png';
import crossControl from '../assets/cross-control.jpg';
import deathScream from '../assets/death-scream.mp3';
import flashlightControl from '../assets/flashlight-control.jpg';
import gameOverGrandma from '../assets/game-over-grandma.jpg';
import heldCross from '../assets/held-cross-cutout.png';
import knockOnWindow from '../assets/knock-on-the-window.mp3';
import scaryGrandma from '../assets/scary-grandma.jpg';
import scaryRoom from '../assets/scary-room.jpg';
import stalkerImpact from '../assets/stalker-impact.mp3';

type HeldItem = 'flashlight' | 'cross';
type StalkerInput = 'KeyQ' | 'KeyE' | 'KeyF' | 'KeyR';

type RoomSceneProps = {
  difficultyName: string;
  batteryDrainSeconds: number;
  grandmaReactionSeconds: number;
  showMobileControls: boolean;
  onBackToMenu: () => void;
};

const minGrandmaSpawnDelayMs = 11000;
const randomGrandmaSpawnDelayMs = 7000;
const minStalkerSpawnDelayMs = 8000;
const randomStalkerSpawnDelayMs = 8000;
const nightDurationSeconds = 5 * 60;
const stalkerMinigameLength = 4;
const stalkerKeys: StalkerInput[] = ['KeyQ', 'KeyE', 'KeyF', 'KeyR'];
const stalkerReactionMs = 3000;
const areMonstersEnabled = true;
const cameraSpeed = 1.6;

function createStalkerSequence() {
  return Array.from({ length: stalkerMinigameLength }, (): StalkerInput => stalkerKeys[Math.floor(Math.random() * stalkerKeys.length)]);
}

export function RoomScene({
  difficultyName,
  batteryDrainSeconds,
  grandmaReactionSeconds,
  showMobileControls,
  onBackToMenu,
}: RoomSceneProps) {
  const stalkerMinigameTimeMs = batteryDrainSeconds === 4 ? 6000 : batteryDrainSeconds === 3 ? 5000 : batteryDrainSeconds === 2 ? 4000 : 3000;
  const [isDoorHovered, setIsDoorHovered] = useState(false);
  const [isCorridorOpen, setIsCorridorOpen] = useState(false);
  const [isApproachingCorridor, setIsApproachingCorridor] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);
  const [heldItem, setHeldItem] = useState<HeldItem>('flashlight');
  const [canToggleFlashlight, setCanToggleFlashlight] = useState(true);
  const [battery, setBattery] = useState(100);
  const [isGrandmaVisible, setIsGrandmaVisible] = useState(false);
  const [grandmaRepelProgress, setGrandmaRepelProgress] = useState(0);
  const [grandmaTimeLeft, setGrandmaTimeLeft] = useState(grandmaReactionSeconds);
  const [isFlashlightFlickering, setIsFlashlightFlickering] = useState(false);
  const [isNightTitleVisible, setIsNightTitleVisible] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStalkerScreamerVisible, setIsStalkerScreamerVisible] = useState(false);
  const [isNightComplete, setIsNightComplete] = useState(false);
  const [nightTimeLeft, setNightTimeLeft] = useState(nightDurationSeconds);
  const [isAimingAtGrandma, setIsAimingAtGrandma] = useState(false);
  const [isStalkerVisible, setIsStalkerVisible] = useState(false);
  const [isStalkerMinigameActive, setIsStalkerMinigameActive] = useState(false);
  const [stalkerSequence, setStalkerSequence] = useState<StalkerInput[]>([]);
  const [stalkerStep, setStalkerStep] = useState(0);
  const [stalkerKeyTimeLeft, setStalkerKeyTimeLeft] = useState(stalkerMinigameTimeMs);
  const [stalkerReactionLeft, setStalkerReactionLeft] = useState(stalkerReactionMs);
  const toggleTimer = useRef<number | null>(null);
  const cameraKeys = useRef(new Set<string>());
  const virtualCamera = useRef({ x: 0, y: 0 });
  const roomWindow = useRef<HTMLDivElement | null>(null);
  const stalker = useRef<HTMLDivElement | null>(null);
  const knockSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const stalkerImpactSound = useRef<HTMLAudioElement | null>(null);
  const isThreatActive = isGrandmaVisible || isStalkerVisible || isStalkerMinigameActive || isStalkerScreamerVisible;
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [flashOffset, setFlashOffset] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
        cameraKeys.current.add(event.code);
      }

      if (isStalkerMinigameActive && pressStalkerKey(event.code)) {
        event.preventDefault();
        return;
      }

      if (event.code === 'KeyE') {
        if (isGameOver || isNightComplete) return;
        event.preventDefault();
        if (isCorridorOpen) {
          setIsCorridorOpen(false);
          return;
        }

        setIsApproachingCorridor(true);
        window.setTimeout(() => {
          setIsCorridorOpen(true);
          setIsApproachingCorridor(false);
        }, 850);
      }

      if (event.code === 'Digit1') {
        if (isGameOver || isNightComplete) return;
        event.preventDefault();
        setHeldItem('flashlight');
      }

      if (event.code === 'Digit2' || event.code === 'KeyC') {
        if (isGameOver || isNightComplete) return;
        event.preventDefault();
        setHeldItem('cross');
      }

      if (event.code === 'KeyF' && battery > 0) {
        if (isGameOver || isNightComplete) return;
        event.preventDefault();

        if (!canToggleFlashlight) return;

        setIsFlashlightOn((current) => !current);
        setCanToggleFlashlight(false);
        toggleTimer.current = window.setTimeout(() => setCanToggleFlashlight(true), 700);
      }

    }

    function handleKeyUp(event: KeyboardEvent) {
      cameraKeys.current.delete(event.code);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    battery,
    canToggleFlashlight,
    isCorridorOpen,
    isDoorHovered,
    isGameOver,
    isNightComplete,
    isStalkerMinigameActive,
    stalkerSequence,
    stalkerStep,
  ]);

  useEffect(() => {
    let frame = 0;
    let lastTick = performance.now();

    function tick() {
      const now = performance.now();
      const delta = Math.min(0.04, (now - lastTick) / 1000);
      lastTick = now;

      setViewOffset((current) => {
        const xDirection = Number(cameraKeys.current.has('KeyD')) - Number(cameraKeys.current.has('KeyA')) + virtualCamera.current.x;
        const yDirection = Number(cameraKeys.current.has('KeyS')) - Number(cameraKeys.current.has('KeyW')) + virtualCamera.current.y;
        if (xDirection === 0 && yDirection === 0) return current;

        return {
          x: Math.max(-1, Math.min(1, current.x + xDirection * cameraSpeed * delta)),
          y: Math.max(-0.45, Math.min(0.18, current.y + yDirection * cameraSpeed * delta)),
        };
      });

      frame = window.requestAnimationFrame(tick);
    }

    tick();
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (toggleTimer.current) window.clearTimeout(toggleTimer.current);
      knockSound.current?.pause();
      deathSound.current?.pause();
      stalkerImpactSound.current?.pause();
    };
  }, []);

  useEffect(() => {
    knockSound.current = new Audio(knockOnWindow);
    knockSound.current.volume = 0.9;
    deathSound.current = new Audio(deathScream);
    deathSound.current.volume = 0.95;
    stalkerImpactSound.current = new Audio(stalkerImpact);
    stalkerImpactSound.current.volume = 0.95;
  }, []);

  function triggerGameOver(shouldPlayDeathSound = true) {
    if (shouldPlayDeathSound && deathSound.current) {
      deathSound.current.currentTime = 0;
      void deathSound.current.play();
    }

    setIsGameOver(true);
  }

  function playGrandmaKnocks() {
    [0, 180, 360].forEach((delay) => {
      window.setTimeout(() => {
        if (!knockSound.current) return;
        knockSound.current.currentTime = 0;
        void knockSound.current.play();
      }, delay);
    });
  }

  function chooseItem(item: HeldItem) {
    if (isGameOver || isNightComplete) return;
    setHeldItem(item);
    if (item === 'flashlight' && battery > 0) setIsFlashlightOn(true);
  }

  function moveJoystick(clientX: number, clientY: number, element: HTMLDivElement) {
    const bounds = element.getBoundingClientRect();
    const radius = bounds.width / 2;
    const x = (clientX - bounds.left - radius) / radius;
    const y = (clientY - bounds.top - radius) / radius;
    const length = Math.hypot(x, y);
    const normalized = length > 1 ? { x: x / length, y: y / length } : { x, y };
    virtualCamera.current = normalized;
    setJoystickKnob({ x: normalized.x * 22, y: normalized.y * 22 });
  }

  function releaseJoystick() {
    virtualCamera.current = { x: 0, y: 0 };
    setJoystickKnob({ x: 0, y: 0 });
  }

  function triggerStalkerGameOver() {
    setIsStalkerVisible(false);
    setIsStalkerMinigameActive(false);
    setIsStalkerScreamerVisible(true);

    window.setTimeout(() => {
      if (stalkerImpactSound.current) {
        stalkerImpactSound.current.currentTime = 0;
        void stalkerImpactSound.current.play();
      }
    }, 150);

    window.setTimeout(() => {
      setIsStalkerScreamerVisible(false);
      triggerGameOver(false);
    }, 300);
  }

  function pressStalkerKey(keyCode: string) {
    if (!stalkerKeys.includes(keyCode as StalkerInput)) return false;

    const expectedInput = stalkerSequence[stalkerStep];
    if (keyCode !== expectedInput) {
      setIsStalkerVisible(false);
      setIsStalkerMinigameActive(false);
      setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      triggerStalkerGameOver();
      return true;
    }

    const nextStep = stalkerStep + 1;
    if (nextStep >= stalkerSequence.length) {
      setIsStalkerVisible(false);
      setIsStalkerMinigameActive(false);
      setStalkerStep(0);
      setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      return true;
    }

    setStalkerStep(nextStep);
    return true;
  }

  useEffect(() => {
    const titleTimer = window.setTimeout(() => setIsNightTitleVisible(false), 7000);
    return () => window.clearTimeout(titleTimer);
  }, []);

  useEffect(() => {
    if (!isStalkerMinigameActive) setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
  }, [isStalkerMinigameActive, stalkerMinigameTimeMs]);

  useEffect(() => {
    if (isGameOver || isNightComplete) return;

    const nightTimer = window.setInterval(() => {
      setNightTimeLeft((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          setIsNightComplete(true);
          setIsGrandmaVisible(false);
          setIsStalkerVisible(false);
          setIsStalkerMinigameActive(false);
          setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(nightTimer);
  }, [isGameOver, isNightComplete]);

  useEffect(() => {
    if (!areMonstersEnabled || isGameOver || isNightComplete || isThreatActive) return;

    const stalkerTimer = window.setTimeout(() => {
      setIsStalkerVisible(true);
      setIsStalkerMinigameActive(false);
      setStalkerSequence(createStalkerSequence());
      setStalkerStep(0);
      setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      setStalkerReactionLeft(stalkerReactionMs);
    }, minStalkerSpawnDelayMs + Math.random() * randomStalkerSpawnDelayMs);

    return () => window.clearTimeout(stalkerTimer);
  }, [isGameOver, isNightComplete, isThreatActive, stalkerMinigameTimeMs]);

  useEffect(() => {
    if (isGameOver || isNightComplete || heldItem !== 'flashlight' || !isFlashlightOn || battery <= 0) return;

    let lastTick = performance.now();
    const batteryTimer = window.setInterval(() => {
      const currentTick = performance.now();
      const elapsed = currentTick - lastTick;
      lastTick = currentTick;

      setBattery((current) => Math.max(0, current - elapsed / (batteryDrainSeconds * 1000)));
    }, 100);

    return () => window.clearInterval(batteryTimer);
  }, [batteryDrainSeconds, heldItem, isFlashlightOn, isGameOver, isNightComplete]);

  useEffect(() => {
    if (battery === 0) setIsFlashlightOn(false);
  }, [battery]);

  useEffect(() => {
    if (isGameOver || isNightComplete || heldItem !== 'flashlight' || !isFlashlightOn || isCorridorOpen || battery >= 30 || battery <= 0) {
      setIsFlashlightFlickering(false);
      return;
    }

    const flickerTimer = window.setInterval(() => {
      setIsFlashlightFlickering(true);
      window.setTimeout(() => setIsFlashlightFlickering(false), 500);
    }, 5000);

    return () => window.clearInterval(flickerTimer);
  }, [battery, heldItem, isCorridorOpen, isFlashlightOn, isGameOver, isNightComplete]);

  useEffect(() => {
    if (!areMonstersEnabled || isGameOver || isNightComplete || isThreatActive) return;

    const difficultyStep = Math.max(0, Math.round((4 - batteryDrainSeconds) / 1));
    const difficultyDelayBonus = difficultyStep * 500;
    const spawnDelay = Math.max(
      6000,
      minGrandmaSpawnDelayMs + Math.random() * randomGrandmaSpawnDelayMs - difficultyDelayBonus,
    );
    const visitTimer = window.setTimeout(() => {
      playGrandmaKnocks();

      setIsGrandmaVisible(true);
      setGrandmaRepelProgress(0);
      setGrandmaTimeLeft(grandmaReactionSeconds);
      setIsAimingAtGrandma(false);
    }, spawnDelay);

    return () => window.clearTimeout(visitTimer);
  }, [batteryDrainSeconds, grandmaReactionSeconds, isGameOver, isNightComplete, isThreatActive]);

  useEffect(() => {
    if (!isGrandmaVisible || isGameOver || isNightComplete) return;

    const repelTimer = window.setInterval(() => {
      const isRepellingGrandma = !isCorridorOpen && heldItem === 'flashlight' && isFlashlightOn;

      setIsAimingAtGrandma(isRepellingGrandma);

      if (!isRepellingGrandma) {
        setGrandmaTimeLeft((current) => {
          const next = Math.max(0, current - 0.1);
          if (next === 0) {
            triggerGameOver();
            setIsGrandmaVisible(false);
            setIsAimingAtGrandma(false);
          }

          return next;
        });
        return;
      }

      setGrandmaRepelProgress((current) => {
        const next = current + 0.1;
        if (next >= 0.95) {
          setIsGrandmaVisible(false);
          setGrandmaTimeLeft(grandmaReactionSeconds);
          setIsAimingAtGrandma(false);
          return 0;
        }

        return next;
      });
    }, 100);

    return () => window.clearInterval(repelTimer);
  }, [grandmaReactionSeconds, heldItem, isCorridorOpen, isFlashlightOn, isGameOver, isGrandmaVisible, isNightComplete]);

  useEffect(() => {
    if (!isStalkerVisible || isGameOver || isNightComplete) return;

    const stalkerTimer = window.setInterval(() => {
      const canStartMinigame = heldItem === 'cross';
      if (canStartMinigame && !isStalkerMinigameActive) {
        setIsStalkerMinigameActive(true);
        setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      }
    }, 100);

    return () => window.clearInterval(stalkerTimer);
  }, [heldItem, isGameOver, isNightComplete, isStalkerMinigameActive, isStalkerVisible, stalkerMinigameTimeMs]);

  useEffect(() => {
    if (!isStalkerVisible || isStalkerMinigameActive || isGameOver || isNightComplete) return;

    const reactionTimer = window.setInterval(() => {
      setStalkerReactionLeft((current) => {
        const next = Math.max(0, current - 100);
        if (next === 0) triggerStalkerGameOver();
        return next;
      });
    }, 100);

    return () => window.clearInterval(reactionTimer);
  }, [isGameOver, isNightComplete, isStalkerMinigameActive, isStalkerVisible]);

  useEffect(() => {
    if (!isStalkerVisible || !isStalkerMinigameActive || isGameOver || isNightComplete) return;

    function tickStalkerKey() {
      setStalkerKeyTimeLeft((current) => {
        const next = Math.max(0, current - 100);
        if (next === 0) {
          setIsStalkerVisible(false);
          setIsStalkerMinigameActive(false);
          triggerStalkerGameOver();
        }

        return next;
      });
    }

    tickStalkerKey();
    const keyTimer = window.setInterval(tickStalkerKey, 100);

    return () => window.clearInterval(keyTimer);
  }, [isGameOver, isNightComplete, isStalkerMinigameActive, isStalkerVisible]);

  const isEasyMode = batteryDrainSeconds === 4;
  const isFlashlightActive = heldItem === 'flashlight' && isFlashlightOn;
  const style = {
    '--view-x': viewOffset.x,
    '--view-y': viewOffset.y,
    '--flash-x': flashOffset.x,
    '--flash-y': flashOffset.y,
  } as CSSProperties;
  const nightMinutes = Math.floor(nightTimeLeft / 60);
  const nightSeconds = String(nightTimeLeft % 60).padStart(2, '0');
  const stalkerInputLabel = (stalkerSequence[stalkerStep] ?? 'KeyQ').replace('Key', '');
  const stalkerProgress = (stalkerStep / stalkerMinigameLength) * 100;
  const stalkerKeyTimeProgress = (stalkerKeyTimeLeft / stalkerMinigameTimeMs) * 100;
  const stalkerReactionProgress = (stalkerReactionLeft / stalkerReactionMs) * 100;
  const shouldShowGrandmaWarning = isGrandmaVisible && !isCorridorOpen && (isEasyMode || isAimingAtGrandma || grandmaRepelProgress > 0);

  return (
    <section
      className={isFlashlightActive ? 'room-scene' : 'room-scene room-blackout'}
      style={style}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setFlashOffset({
          x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
          y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
        });
      }}
      aria-label="Первая ночь"
    >
      <div className="room-panorama">
        <img className="room-image" src={scaryRoom} alt="" aria-hidden="true" />
        {areMonstersEnabled && isStalkerVisible && (
          <div className="ceiling-stalker" ref={stalker} aria-hidden="true">
            <img src={ceilingStalker} alt="" />
          </div>
        )}
        <div className="room-bed" aria-hidden="true" />
        <div className="room-pipe" aria-hidden="true">
          <span className="water-drop water-drop-one" />
          <span className="water-drop water-drop-two" />
        </div>
        <button
          className="door-hotspot"
          type="button"
          onClick={() => {
            if (isGameOver) return;
            setIsApproachingCorridor(true);
            window.setTimeout(() => {
              setIsCorridorOpen(true);
              setIsApproachingCorridor(false);
            }, 850);
          }}
          onMouseEnter={() => setIsDoorHovered(true)}
          onMouseLeave={() => setIsDoorHovered(false)}
          aria-label="Заглянуть в коридор"
        />
        <div className="room-window" ref={roomWindow} aria-hidden="true">
          {areMonstersEnabled && isGrandmaVisible && <img className="window-grandma" src={scaryGrandma} alt="" />}
          <span />
          <span />
        </div>
      </div>
      {isApproachingCorridor && <div className="approach-door" aria-hidden="true" />}
      <div
        className={isFlashlightFlickering ? 'flashlight flashlight-on flashlight-flicker' : 'flashlight flashlight-on'}
        aria-hidden="true"
        hidden={!isFlashlightActive}
      />
      {heldItem === 'cross' && (
        <div className="held-cross" aria-hidden="true">
          <img src={heldCross} alt="" />
        </div>
      )}
      {areMonstersEnabled && isStalkerVisible && (
        <div className="blood-drips" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      {areMonstersEnabled && isStalkerVisible && isStalkerMinigameActive && (
        <div className="stalker-minigame">
          <button
            className="stalker-letter-button"
            type="button"
            onClick={() => pressStalkerKey(stalkerSequence[stalkerStep] ?? 'KeyQ')}
          >
            {stalkerInputLabel}
          </button>
          <b style={{ width: `${stalkerProgress}%` }} />
          <i style={{ width: `${stalkerKeyTimeProgress}%` }} />
        </div>
      )}
      {areMonstersEnabled && isStalkerVisible && !isStalkerMinigameActive && (
        <div className="stalker-warning">
          <span>Наведи крест</span>
          <b style={{ width: `${stalkerReactionProgress}%` }} />
        </div>
      )}
      {isNightTitleVisible && <h1>Первая ночь началась.</h1>}
      {isDoorHovered && !isCorridorOpen && <p className="door-prompt">Нажмите E, чтобы заглянуть</p>}
      {areMonstersEnabled && isStalkerScreamerVisible && (
        <div className="stalker-screamer" aria-hidden="true">
          <img src={ceilingStalker} alt="" />
        </div>
      )}
      {areMonstersEnabled && shouldShowGrandmaWarning && (
        <div className={isEasyMode ? 'grandma-warning' : 'grandma-warning grandma-warning-progress'}>
          <span>Свети в окно!</span>
          {isEasyMode && <em>{grandmaTimeLeft.toFixed(1)}s</em>}
          <b style={{ width: `${grandmaRepelProgress * 100}%` }} />
        </div>
      )}
      {isGameOver && (
        <div className="grandma-screamer" role="alert">
          <img src={gameOverGrandma} alt="" aria-hidden="true" />
          <strong>GAME OVER</strong>
          <button className="screamer-menu-button" type="button" onClick={onBackToMenu}>
            Вернутся в меню
          </button>
        </div>
      )}
      {isNightComplete && (
        <div className="night-complete" role="status">
          <h2>Первая ночь закончилась</h2>
          <button className="horror-button horror-button-primary" type="button" onClick={onBackToMenu}>
            Вернуться в меню
          </button>
        </div>
      )}
      <div className="item-hint">1 - фонарик / 2 - крест</div>
      {showMobileControls && (
        <div className="mobile-controls-layer">
      <div className="mobile-camera-stick">
        <div
          className="mobile-joystick"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            moveJoystick(event.clientX, event.clientY, event.currentTarget);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            moveJoystick(event.clientX, event.clientY, event.currentTarget);
          }}
          onPointerUp={releaseJoystick}
          onPointerCancel={releaseJoystick}
          role="presentation"
        >
          <span style={{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }} />
        </div>
      </div>
      <div className="mobile-item-controls" aria-label="Предметы">
        <button
          className={heldItem === 'flashlight' ? 'mobile-item-button mobile-item-button-active' : 'mobile-item-button'}
          type="button"
          onClick={() => chooseItem('flashlight')}
          aria-label="Фонарик"
        >
          <img src={flashlightControl} alt="" />
        </button>
        <button
          className={heldItem === 'cross' ? 'mobile-item-button mobile-item-button-active' : 'mobile-item-button'}
          type="button"
          onClick={() => chooseItem('cross')}
          aria-label="Крест"
        >
          <img src={crossControl} alt="" />
        </button>
      </div>
        </div>
      )}
      <div className="room-hud">
        <span>Ночь: {nightMinutes}:{nightSeconds}</span>
        <span>Фонарик: {isFlashlightOn ? 'Вкл' : 'Выкл'}</span>
        <span>Батарея: {Math.ceil(battery)}%</span>
        <span>Сложность: {difficultyName}</span>
      </div>
    </section>
  );
}
