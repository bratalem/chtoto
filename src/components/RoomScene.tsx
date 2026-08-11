import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { DifficultyName } from '../pages/HomePage';
import scaryRoom from '../assets/scary-room.jpg';

type Position = {
  x: number;
  y: number;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type RoomSceneProps = {
  difficultyName: DifficultyName;
  batteryDrainSeconds: number;
};

export function RoomScene({ difficultyName, batteryDrainSeconds }: RoomSceneProps) {
  const [view, setView] = useState<Position>({ x: 0, y: 0 });
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);
  const [canToggleFlashlight, setCanToggleFlashlight] = useState(true);
  const [battery, setBattery] = useState(100);
  const [isNightTitleVisible, setIsNightTitleVisible] = useState(true);
  const audioContext = useRef<AudioContext | null>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const moveFrame = useRef<number | null>(null);
  const toggleTimer = useRef<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'KeyF' && battery > 0) {
        event.preventDefault();
        if (!canToggleFlashlight) {
          return;
        }

        setIsFlashlightOn((current) => !current);
        setCanToggleFlashlight(false);
        toggleTimer.current = window.setTimeout(() => setCanToggleFlashlight(true), 700);
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        pressedKeys.current.add(event.code);
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault();
        pressedKeys.current.add(event.code);
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault();
        pressedKeys.current.add(event.code);
      }

      if (event.code === 'ArrowDown') {
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
  }, [battery, canToggleFlashlight]);

  useEffect(() => {
    function moveView() {
      setView((current) => {
        if (pressedKeys.current.size === 0) {
          return current;
        }

        let nextX = current.x;
        let nextY = current.y;
        const speed = 0.035;

        if (pressedKeys.current.has('ArrowLeft')) {
          nextX -= speed;
        }

        if (pressedKeys.current.has('ArrowRight')) {
          nextX += speed;
        }

        if (pressedKeys.current.has('ArrowUp')) {
          nextY -= speed;
        }

        if (pressedKeys.current.has('ArrowDown')) {
          nextY += speed;
        }

        return {
          x: Math.min(1, Math.max(-1, nextX)),
          y: Math.min(0.65, Math.max(-1, nextY)),
        };
      });

      moveFrame.current = window.requestAnimationFrame(moveView);
    }

    moveFrame.current = window.requestAnimationFrame(moveView);

    return () => {
      if (moveFrame.current) {
        window.cancelAnimationFrame(moveFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toggleTimer.current) {
        window.clearTimeout(toggleTimer.current);
      }

      if (moveFrame.current) {
        window.cancelAnimationFrame(moveFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    const titleTimer = window.setTimeout(() => setIsNightTitleVisible(false), 7000);
    return () => window.clearTimeout(titleTimer);
  }, []);

  useEffect(() => {
    function playWaterDrop() {
      const audioWindow = window as AudioWindow;
      const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      audioContext.current ??= new AudioContextClass();

      const context = audioContext.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(720, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(180, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.25);
    }

    const dropTimer = window.setInterval(playWaterDrop, 2400);
    return () => window.clearInterval(dropTimer);
  }, []);

  useEffect(() => {
    if (!isFlashlightOn || battery <= 0) {
      return;
    }

    const batteryTimer = window.setInterval(() => {
      setBattery((current) => Math.max(0, current - 1));
    }, batteryDrainSeconds * 1000);

    return () => window.clearInterval(batteryTimer);
  }, [battery, batteryDrainSeconds, isFlashlightOn]);

  useEffect(() => {
    if (battery === 0) {
      setIsFlashlightOn(false);
    }
  }, [battery]);

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
      <div className="room-ceiling" aria-hidden="true" />
      <div className="room-panorama">
        <img className="room-image" src={scaryRoom} alt="" aria-hidden="true" />
        <div className="room-floor" aria-hidden="true" />
        <div className="room-bed" aria-hidden="true" />
        <div className="room-pipe" aria-hidden="true">
          <span className="water-drop water-drop-one" />
          <span className="water-drop water-drop-two" />
        </div>
        <div className="room-window" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
      <div
        className={battery < 30 ? 'flashlight flashlight-on flashlight-low' : 'flashlight flashlight-on'}
        aria-hidden="true"
        hidden={!isFlashlightOn}
      />
      {isNightTitleVisible && <h1>Первая ночь началась.</h1>}
      <div className="room-hud">
        <span>Фонарик: {isFlashlightOn ? 'Вкл' : 'Выкл'} {canToggleFlashlight ? '' : '(пауза)'}</span>
        <span>Батарея: {battery}%</span>
        <span>Сложность: {difficultyName}</span>
      </div>
    </section>
  );
}
