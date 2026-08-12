import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import scaryCorridor from '../assets/scary-corridor.jpg';
import scaryGrandma from '../assets/scary-grandma.jpg';
import scaryRoom from '../assets/scary-room.jpg';

type Position = {
  x: number;
  y: number;
};

type RoomSceneProps = {
  difficultyName: string;
  batteryDrainSeconds: number;
  grandmaReactionSeconds: number;
};

export function RoomScene({ difficultyName, batteryDrainSeconds, grandmaReactionSeconds }: RoomSceneProps) {
  const [view, setView] = useState<Position>({ x: 0, y: 0 });
  const [isDoorHovered, setIsDoorHovered] = useState(false);
  const [isCorridorOpen, setIsCorridorOpen] = useState(false);
  const [isApproachingCorridor, setIsApproachingCorridor] = useState(false);
  const [isCorridorLightOn, setIsCorridorLightOn] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);
  const [canToggleFlashlight, setCanToggleFlashlight] = useState(true);
  const [battery, setBattery] = useState(100);
  const [isGrandmaVisible, setIsGrandmaVisible] = useState(false);
  const [grandmaRepelProgress, setGrandmaRepelProgress] = useState(0);
  const [grandmaTimeLeft, setGrandmaTimeLeft] = useState(grandmaReactionSeconds);
  const [isFlashlightFlickering, setIsFlashlightFlickering] = useState(false);
  const [isNightTitleVisible, setIsNightTitleVisible] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const pressedKeys = useRef<Set<string>>(new Set());
  const moveFrame = useRef<number | null>(null);
  const toggleTimer = useRef<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'KeyE') {
        if (isGameOver) return;
        event.preventDefault();
        if (isCorridorOpen) {
          setIsCorridorOpen(false);
          setIsCorridorLightOn(false);
          return;
        }

        if (!isDoorHovered) return;

        setIsApproachingCorridor(true);
        window.setTimeout(() => {
          setIsCorridorOpen(true);
          setIsApproachingCorridor(false);
        }, 850);
      }

      if (event.code === 'KeyF' && battery > 0) {
        if (isGameOver) return;
        event.preventDefault();
        if (isCorridorOpen) {
          setIsCorridorLightOn((current) => !current);
          return;
        }

        if (!canToggleFlashlight) return;

        setIsFlashlightOn((current) => !current);
        setCanToggleFlashlight(false);
        toggleTimer.current = window.setTimeout(() => setCanToggleFlashlight(true), 700);
      }

      if (event.code.startsWith('Arrow')) {
        if (isGameOver) return;
        event.preventDefault();
        pressedKeys.current.add(event.code);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code.startsWith('Arrow')) {
        pressedKeys.current.delete(event.code);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [battery, canToggleFlashlight, isCorridorOpen, isDoorHovered, isGameOver]);

  useEffect(() => {
    function moveView() {
      setView((current) => {
        if (isGameOver || pressedKeys.current.size === 0) return current;

        let nextX = current.x;
        let nextY = current.y;
        const speed = 0.035;

        if (pressedKeys.current.has('ArrowLeft')) nextX -= speed;
        if (pressedKeys.current.has('ArrowRight')) nextX += speed;
        if (pressedKeys.current.has('ArrowUp')) nextY -= speed;
        if (pressedKeys.current.has('ArrowDown')) nextY += speed;

        return {
          x: Math.min(1, Math.max(-1, nextX)),
          y: Math.min(0.8, Math.max(-1.8, nextY)),
        };
      });

      moveFrame.current = window.requestAnimationFrame(moveView);
    }

    moveFrame.current = window.requestAnimationFrame(moveView);
    return () => {
      if (moveFrame.current) window.cancelAnimationFrame(moveFrame.current);
    };
  }, [isGameOver]);

  useEffect(() => {
    return () => {
      if (toggleTimer.current) window.clearTimeout(toggleTimer.current);
    };
  }, []);

  useEffect(() => {
    const titleTimer = window.setTimeout(() => setIsNightTitleVisible(false), 7000);
    return () => window.clearTimeout(titleTimer);
  }, []);

  useEffect(() => {
    if (isGameOver || !isFlashlightOn || battery <= 0) return;

    const batteryTimer = window.setInterval(() => {
      setBattery((current) => Math.max(0, current - 1));
    }, batteryDrainSeconds * 1000);

    return () => window.clearInterval(batteryTimer);
  }, [battery, batteryDrainSeconds, isFlashlightOn, isGameOver]);

  useEffect(() => {
    if (battery === 0) setIsFlashlightOn(false);
  }, [battery]);

  useEffect(() => {
    if (isGameOver || !isFlashlightOn || isCorridorOpen || battery >= 30 || battery <= 0) {
      setIsFlashlightFlickering(false);
      return;
    }

    const flickerTimer = window.setInterval(() => {
      setIsFlashlightFlickering(true);
      window.setTimeout(() => setIsFlashlightFlickering(false), 500);
    }, 5000);

    return () => window.clearInterval(flickerTimer);
  }, [battery, isCorridorOpen, isFlashlightOn, isGameOver]);

  useEffect(() => {
    if (isGameOver || isCorridorOpen || isGrandmaVisible) return;

    const visitTimer = window.setTimeout(() => {
      setIsGrandmaVisible(true);
      setGrandmaRepelProgress(0);
      setGrandmaTimeLeft(grandmaReactionSeconds);
    }, 9000 + Math.random() * 9000);

    return () => window.clearTimeout(visitTimer);
  }, [grandmaReactionSeconds, isCorridorOpen, isGameOver, isGrandmaVisible]);

  useEffect(() => {
    if (!isGrandmaVisible || isGameOver) return;

    const repelTimer = window.setInterval(() => {
      const isLookingAtWindow = view.x > 0.35;

      if (isCorridorOpen || !isFlashlightOn || !isLookingAtWindow) {
        setGrandmaTimeLeft((current) => {
          const next = Math.max(0, current - 0.1);
          if (next === 0) {
            setIsGameOver(true);
            setIsGrandmaVisible(false);
          }

          return next;
        });
        return;
      }

      setGrandmaRepelProgress((current) => {
        const next = current + 0.1;
        if (next >= 1) {
          setIsGrandmaVisible(false);
          setGrandmaTimeLeft(grandmaReactionSeconds);
          return 0;
        }

        return next;
      });
    }, 100);

    return () => window.clearInterval(repelTimer);
  }, [grandmaReactionSeconds, isCorridorOpen, isFlashlightOn, isGameOver, isGrandmaVisible, view.x]);

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    event.currentTarget.style.setProperty('--flash-x', String(((event.clientX - centerX) / bounds.width) * 2));
    event.currentTarget.style.setProperty('--flash-y', String(((event.clientY - centerY) / bounds.height) * 2));
  }

  const style = {
    '--view-x': view.x.toFixed(3),
    '--view-y': view.y.toFixed(3),
    '--flash-x': 0,
    '--flash-y': 0,
  } as CSSProperties;

  return (
    <section
      className={isFlashlightOn ? 'room-scene' : 'room-scene room-blackout'}
      style={style}
      onMouseMove={handleMouseMove}
      aria-label="Первая ночь"
    >
      <div className="room-panorama">
        <img className="room-image" src={scaryRoom} alt="" aria-hidden="true" />
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
        <div className="room-window" aria-hidden="true">
          {isGrandmaVisible && <img className="grandma-visitor" src={scaryGrandma} alt="" aria-hidden="true" />}
          <span />
          <span />
        </div>
      </div>
      {isApproachingCorridor && <div className="approach-door" aria-hidden="true" />}
      {isCorridorOpen && (
        <div className={isCorridorLightOn ? 'corridor-view corridor-view-lit' : 'corridor-view'}>
          <img src={scaryCorridor} alt="" aria-hidden="true" />
        </div>
      )}
      <div
        className={isFlashlightFlickering ? 'flashlight flashlight-on flashlight-flicker' : 'flashlight flashlight-on'}
        aria-hidden="true"
        hidden={!isFlashlightOn || isCorridorOpen}
      />
      {isNightTitleVisible && <h1>Первая ночь началась.</h1>}
      {isDoorHovered && !isCorridorOpen && <p className="door-prompt">Нажмите E, чтобы заглянуть</p>}
      {isGrandmaVisible && !isCorridorOpen && (
        <div className="grandma-warning">
          <span>Свети в окно!</span>
          <em>{grandmaTimeLeft.toFixed(1)}s</em>
          <b style={{ width: `${grandmaRepelProgress * 100}%` }} />
        </div>
      )}
      {isGameOver && (
        <div className="grandma-screamer" role="alert">
          <img src={scaryGrandma} alt="" aria-hidden="true" />
          <strong>GAME OVER</strong>
        </div>
      )}
      <div className="room-hud">
        <span>Фонарик: {isFlashlightOn ? 'Вкл' : 'Выкл'}</span>
        {isCorridorOpen && <span>Свет в коридоре: {isCorridorLightOn ? 'Вкл' : 'Выкл'}</span>}
        <span>Батарея: {battery}%</span>
        <span>Сложность: {difficultyName}</span>
      </div>
    </section>
  );
}
