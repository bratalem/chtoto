import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import batteryThief from '../assets/battery-thief.jpg';
import ceilingStalker from '../assets/ceiling-stalker.png';
import crossControl from '../assets/cross-control.jpg';
import crowbarSwingSheet from '../assets/crowbar-first-person/crowbar-first-person-sheet.png';
import deathScream from '../assets/death-scream.mp3';
import flashlightControl from '../assets/flashlight-control.jpg';
import gameOverGrandma from '../assets/game-over-grandma.jpg';
import heldCross from '../assets/held-cross-cutout.png';
import knockOnWindow from '../assets/knock-on-the-window.mp3';
import scaryGrandma from '../assets/scary-grandma.jpg';
import scaryRoom from '../assets/scary-room.jpg';
import stalkerImpact from '../assets/stalker-impact.mp3';

type HeldItem = 'flashlight' | 'cross' | 'crowbar';
type StalkerInput = 'KeyQ' | 'KeyE' | 'KeyF' | 'KeyR';
type StalkerButtonPosition = {
  x: number;
  y: number;
};
type TutorialPhase = 'grandmaIntro' | 'grandmaActive' | 'stalkerIntro' | 'stalkerActive' | 'done';

type RoomSceneProps = {
  difficultyName: string;
  batteryDrainSeconds: number;
  grandmaReactionSeconds: number;
  startNight: number;
  showMobileControls: boolean;
  tutorialMode?: boolean;
  onTutorialComplete?: () => void;
  onBackToMenu: () => void;
  onNightUnlocked: (night: number) => void;
};

const minGrandmaSpawnDelayMs = 11000;
const randomGrandmaSpawnDelayMs = 7000;
const firstGrandmaSpawnDelayMs = 14000;
const minStalkerSpawnDelayMs = 8000;
const randomStalkerSpawnDelayMs = 8000;
const nightDurationSeconds = 5 * 60;
const finalNight = 5;
const stalkerMinigameLength = 4;
const stalkerKeys: StalkerInput[] = ['KeyQ', 'KeyE', 'KeyF', 'KeyR'];
const stalkerReactionMs = 3000;
const batteryThiefReactionMs = 5200;
const batteryThiefDrainPercent = 18;
const areMonstersEnabled = true;
const cameraSpeed = 1.6;
const stalkerAimPaddingPx = 55;
const grandmaAimPaddingPx = 70;

function createStalkerButtonPosition(): StalkerButtonPosition {
  return {
    x: 7 + Math.random() * 86,
    y: 8 + Math.random() * 84,
  };
}

function createStalkerSequence() {
  const sequence: StalkerInput[] = [];

  while (sequence.length < stalkerMinigameLength) {
    const previousInput = sequence[sequence.length - 1];
    const availableKeys = stalkerKeys.filter((key) => key !== previousInput);
    sequence.push(availableKeys[Math.floor(Math.random() * availableKeys.length)]);
  }

  return sequence;
}

function getNightPressure(night: number) {
  return Math.min(finalNight - 1, Math.max(0, night - 1));
}

function getNightTitle(night: number) {
  return `Ночь ${night} началась.`;
}

export function RoomScene({
  difficultyName,
  batteryDrainSeconds,
  grandmaReactionSeconds,
  startNight,
  showMobileControls,
  tutorialMode = false,
  onTutorialComplete,
  onBackToMenu,
  onNightUnlocked,
}: RoomSceneProps) {
  const baseStalkerMinigameTimeMs = batteryDrainSeconds === 4 ? 6000 : batteryDrainSeconds === 3 ? 5000 : batteryDrainSeconds === 2 ? 4000 : 3000;
  const stalkerMinigameTimeMs = tutorialMode ? 12000 : baseStalkerMinigameTimeMs;
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
  const [currentNight] = useState(startNight);
  const [nightTimeLeft, setNightTimeLeft] = useState(nightDurationSeconds);
  const [isAimingAtGrandma, setIsAimingAtGrandma] = useState(false);
  const [isStalkerVisible, setIsStalkerVisible] = useState(false);
  const [isStalkerMinigameActive, setIsStalkerMinigameActive] = useState(false);
  const [isBatteryThiefVisible, setIsBatteryThiefVisible] = useState(false);
  const [batteryThiefTimeLeft, setBatteryThiefTimeLeft] = useState(batteryThiefReactionMs);
  const [isCrowbarSwinging, setIsCrowbarSwinging] = useState(false);
  const [stalkerSequence, setStalkerSequence] = useState<StalkerInput[]>([]);
  const [stalkerStep, setStalkerStep] = useState(0);
  const [stalkerButtonPosition, setStalkerButtonPosition] = useState<StalkerButtonPosition>(createStalkerButtonPosition);
  const [stalkerKeyTimeLeft, setStalkerKeyTimeLeft] = useState(stalkerMinigameTimeMs);
  const [stalkerReactionLeft, setStalkerReactionLeft] = useState(stalkerReactionMs);
  const toggleTimer = useRef<number | null>(null);
  const cameraKeys = useRef(new Set<string>());
  const virtualCamera = useRef({ x: 0, y: 0 });
  const roomScene = useRef<HTMLElement | null>(null);
  const roomWindow = useRef<HTMLDivElement | null>(null);
  const stalker = useRef<HTMLDivElement | null>(null);
  const batteryThiefRef = useRef<HTMLButtonElement | null>(null);
  const hasGrandmaVisited = useRef(false);
  const knockSound = useRef<HTMLAudioElement | null>(null);
  const deathSound = useRef<HTMLAudioElement | null>(null);
  const stalkerImpactSound = useRef<HTMLAudioElement | null>(null);
  const crowbarSwingTimer = useRef<number | null>(null);
  const isThreatActive = isGrandmaVisible || isStalkerVisible || isStalkerMinigameActive || isStalkerScreamerVisible || isBatteryThiefVisible;
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [flashOffset, setFlashOffset] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });
  const [isAimingAtStalker, setIsAimingAtStalker] = useState(false);
  const [tutorialPhase, setTutorialPhase] = useState<TutorialPhase | null>(tutorialMode ? 'grandmaIntro' : null);
  const isTutorialPromptVisible = tutorialMode && (tutorialPhase === 'grandmaIntro' || tutorialPhase === 'stalkerIntro' || tutorialPhase === 'done');
  const [flashlightToggleGrace, setFlashlightToggleGrace] = useState(false);
  const [hasReadGrandmaInstruction, setHasReadGrandmaInstruction] = useState(false);
  const [hasReadStalkerInstruction, setHasReadStalkerInstruction] = useState(false);
  const currentStalkerAimPaddingPx = tutorialMode ? 160 : stalkerAimPaddingPx;
  const currentGrandmaAimPaddingPx = tutorialMode ? 180 : showMobileControls ? 20 : grandmaAimPaddingPx;
  const nightPressure = getNightPressure(currentNight);
  const currentStalkerReactionMs = Math.max(1500, stalkerReactionMs - nightPressure * 300);
  const currentGrandmaReactionSeconds = Math.max(1.2, grandmaReactionSeconds - nightPressure * 0.35);
  const currentBatteryDrainSeconds = Math.max(0.75, batteryDrainSeconds - nightPressure * 0.18);
  const currentBatteryThiefReactionMs = Math.max(2800, batteryThiefReactionMs - nightPressure * 450);
  const isGrandmaInstructionVisible = !tutorialMode && isGrandmaVisible && !hasReadGrandmaInstruction;
  const isStalkerInstructionVisible = !tutorialMode && isStalkerVisible && !hasReadStalkerInstruction;
  const isInstructionPromptVisible = isGrandmaInstructionVisible || isStalkerInstructionVisible || isTutorialPromptVisible;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
        cameraKeys.current.add(event.code);
      }

      if (!showMobileControls && isStalkerMinigameActive && pressStalkerKey(event.code)) {
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

      if (event.code === 'Digit3') {
        if (isGameOver || isNightComplete) return;
        event.preventDefault();
        setHeldItem('crowbar');
      }

      if (event.code === 'KeyF' && battery > 0) {
        if (isGameOver || isNightComplete) return;
        event.preventDefault();

        if (!canToggleFlashlight) return;

        setIsFlashlightOn((current) => {
          const next = !current;
          if (next) setFlashlightToggleGrace(true);
          return next;
        });
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
    showMobileControls,
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
          y: Math.max(-1, Math.min(1, current.y + yDirection * cameraSpeed * delta)),
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
      if (crowbarSwingTimer.current) window.clearTimeout(crowbarSwingTimer.current);
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
    if (isInstructionPromptVisible || isGameOver || isNightComplete) return;
    if (item === 'flashlight' && heldItem === 'flashlight' && battery > 0) {
      setIsFlashlightOn((current) => {
        const next = !current;
        if (next) setFlashlightToggleGrace(true);
        return next;
      });
      return;
    }

    setHeldItem(item);
    if (item === 'flashlight' && battery > 0) {
      setIsFlashlightOn(true);
      setFlashlightToggleGrace(true);
    }
  }

  function hitBatteryThief() {
    if (!isBatteryThiefVisible || heldItem !== 'crowbar' || isInstructionPromptVisible || isGameOver || isNightComplete) return;
    if (crowbarSwingTimer.current) window.clearTimeout(crowbarSwingTimer.current);
    setIsCrowbarSwinging(false);
    window.setTimeout(() => setIsCrowbarSwinging(true), 0);
    crowbarSwingTimer.current = window.setTimeout(() => setIsCrowbarSwinging(false), 360);
    setIsBatteryThiefVisible(false);
    setBatteryThiefTimeLeft(currentBatteryThiefReactionMs);
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

  function startTutorialGrandma() {
    playGrandmaKnocks();
    setHeldItem('flashlight');
    setIsFlashlightOn(true);
    setIsGrandmaVisible(true);
    setGrandmaRepelProgress(0);
    setGrandmaTimeLeft(grandmaReactionSeconds);
    setIsAimingAtGrandma(false);
    setHasReadGrandmaInstruction(false);
    setTutorialPhase('grandmaActive');
  }

  function startTutorialStalker() {
    setHeldItem('cross');
    setIsStalkerVisible(true);
    setIsStalkerMinigameActive(false);
    setStalkerSequence(createStalkerSequence());
    setStalkerStep(0);
    setStalkerButtonPosition(createStalkerButtonPosition());
    setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
    setStalkerReactionLeft(stalkerReactionMs);
    setHasReadStalkerInstruction(false);
    setTutorialPhase('stalkerActive');
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

  function pressStalkerButton() {
    const nextStep = stalkerStep + 1;
    if (nextStep >= stalkerMinigameLength) {
      setIsStalkerVisible(false);
      setIsStalkerMinigameActive(false);
      setStalkerStep(0);
      setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      if (tutorialMode && tutorialPhase === 'stalkerActive') setTutorialPhase('done');
      return;
    }

    setStalkerStep(nextStep);
    setStalkerButtonPosition(createStalkerButtonPosition());
  }

  function pressStalkerKey(keyCode: string) {
    if (!stalkerKeys.includes(keyCode as StalkerInput)) return false;

    const expectedInput = stalkerSequence[stalkerStep];
    if (keyCode !== expectedInput) {
      if (tutorialMode) {
        setStalkerStep(0);
        setStalkerSequence(createStalkerSequence());
        setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
        return true;
      }

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
      if (tutorialMode && tutorialPhase === 'stalkerActive') setTutorialPhase('done');
      return true;
    }

    setStalkerStep(nextStep);
    return true;
  }

  function isCrossAimedAtStalker() {
    if (!roomScene.current || !stalker.current) return false;

    const sceneBounds = roomScene.current.getBoundingClientRect();
    const stalkerBounds = stalker.current.getBoundingClientRect();
    const aimX = sceneBounds.left + sceneBounds.width / 2;
    const aimY = sceneBounds.top + sceneBounds.height / 2;
    return (
      aimX >= stalkerBounds.left - currentStalkerAimPaddingPx &&
      aimX <= stalkerBounds.right + currentStalkerAimPaddingPx &&
      aimY >= stalkerBounds.top - currentStalkerAimPaddingPx &&
      aimY <= stalkerBounds.bottom + currentStalkerAimPaddingPx
    );
  }

  function isFlashlightAimedAtGrandma() {
    if (!roomScene.current || !roomWindow.current) return false;

    const sceneBounds = roomScene.current.getBoundingClientRect();
    const windowBounds = roomWindow.current.getBoundingClientRect();
    const aimX = showMobileControls ? sceneBounds.left + sceneBounds.width / 2 : sceneBounds.left + ((flashOffset.x + 1) / 2) * sceneBounds.width;
    const aimY = showMobileControls ? sceneBounds.top + sceneBounds.height / 2 : sceneBounds.top + ((flashOffset.y + 1) / 2) * sceneBounds.height;
    return (
      aimX >= windowBounds.left - currentGrandmaAimPaddingPx &&
      aimX <= windowBounds.right + currentGrandmaAimPaddingPx &&
      aimY >= windowBounds.top - currentGrandmaAimPaddingPx &&
      aimY <= windowBounds.bottom + currentGrandmaAimPaddingPx
    );
  }

  useEffect(() => {
    setIsNightTitleVisible(true);
    const titleTimer = window.setTimeout(() => setIsNightTitleVisible(false), 7000);
    return () => window.clearTimeout(titleTimer);
  }, [currentNight]);

  useEffect(() => {
    if (!isStalkerMinigameActive) setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
  }, [isStalkerMinigameActive, stalkerMinigameTimeMs]);

  useEffect(() => {
    if (isGameOver || isNightComplete) return;

    const nightTimer = window.setInterval(() => {
      setNightTimeLeft((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          onNightUnlocked(Math.min(finalNight, currentNight + 1));
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
  }, [currentNight, isGameOver, isInstructionPromptVisible, isNightComplete, onNightUnlocked, stalkerMinigameTimeMs, tutorialMode]);

  useEffect(() => {
    if (tutorialMode || !areMonstersEnabled || isGameOver || isNightComplete || isThreatActive) return;

    const spawnPressureMs = nightPressure * 1300;
    const stalkerTimer = window.setTimeout(() => {
      setIsStalkerVisible(true);
      setIsStalkerMinigameActive(false);
      setStalkerSequence(createStalkerSequence());
      setStalkerStep(0);
      setStalkerButtonPosition(createStalkerButtonPosition());
      setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      setStalkerReactionLeft(currentStalkerReactionMs);
      setHasReadStalkerInstruction(false);
    }, Math.max(3500, minStalkerSpawnDelayMs + Math.random() * randomStalkerSpawnDelayMs - spawnPressureMs));

    return () => window.clearTimeout(stalkerTimer);
  }, [currentNight, currentStalkerReactionMs, isGameOver, isNightComplete, isThreatActive, nightPressure, stalkerMinigameTimeMs, tutorialMode]);

  useEffect(() => {
    if (tutorialMode || !areMonstersEnabled || isGameOver || isNightComplete || isThreatActive) return;

    const spawnDelay = Math.max(6500, 17000 + Math.random() * 10000 - nightPressure * 2200);
    const thiefTimer = window.setTimeout(() => {
      setIsBatteryThiefVisible(true);
      setBatteryThiefTimeLeft(currentBatteryThiefReactionMs);
    }, spawnDelay);

    return () => window.clearTimeout(thiefTimer);
  }, [currentBatteryThiefReactionMs, isGameOver, isNightComplete, isThreatActive, nightPressure, tutorialMode]);

  useEffect(() => {
    if (!isBatteryThiefVisible || isInstructionPromptVisible || isGameOver || isNightComplete) return;

    const thiefTimer = window.setInterval(() => {
      setBatteryThiefTimeLeft((current) => {
        const next = Math.max(0, current - 100);
        if (next === 0) {
          setBattery((batteryLevel) => Math.max(0, batteryLevel - batteryThiefDrainPercent));
          setIsBatteryThiefVisible(false);
          return currentBatteryThiefReactionMs;
        }

        return next;
      });
    }, 100);

    return () => window.clearInterval(thiefTimer);
  }, [currentBatteryThiefReactionMs, isBatteryThiefVisible, isGameOver, isInstructionPromptVisible, isNightComplete]);

  useEffect(() => {
    if (tutorialMode || isInstructionPromptVisible || isGameOver || isNightComplete || heldItem !== 'flashlight' || !isFlashlightOn || battery <= 0) return;

    let lastTick = performance.now();
    const batteryTimer = window.setInterval(() => {
      const currentTick = performance.now();
      const elapsed = currentTick - lastTick;
      lastTick = currentTick;

      setBattery((current) => Math.max(0, current - elapsed / (currentBatteryDrainSeconds * 1000)));
    }, 100);

    return () => window.clearInterval(batteryTimer);
  }, [currentBatteryDrainSeconds, heldItem, isFlashlightOn, isGameOver, isInstructionPromptVisible, isNightComplete, tutorialMode]);

  useEffect(() => {
    if (battery === 0) setIsFlashlightOn(false);
  }, [battery]);

  useEffect(() => {
    if (!flashlightToggleGrace) return;

    const graceTimer = window.setTimeout(() => setFlashlightToggleGrace(false), 900);
    return () => window.clearTimeout(graceTimer);
  }, [flashlightToggleGrace]);

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
    if (tutorialMode || !areMonstersEnabled || isGameOver || isNightComplete || isThreatActive) return;

    const difficultyStep = Math.max(0, Math.round((4 - batteryDrainSeconds) / 1));
    const difficultyDelayBonus = difficultyStep * 500 + nightPressure * 1400;
    const spawnDelay = hasGrandmaVisited.current
      ? Math.max(3500, minGrandmaSpawnDelayMs + Math.random() * randomGrandmaSpawnDelayMs - difficultyDelayBonus)
      : Math.max(4500, firstGrandmaSpawnDelayMs - nightPressure * 1800);
    const visitTimer = window.setTimeout(() => {
      hasGrandmaVisited.current = true;
      playGrandmaKnocks();

      setIsGrandmaVisible(true);
      setGrandmaRepelProgress(0);
      setGrandmaTimeLeft(currentGrandmaReactionSeconds);
      setIsAimingAtGrandma(false);
      setHasReadGrandmaInstruction(false);
    }, spawnDelay);

    return () => window.clearTimeout(visitTimer);
  }, [batteryDrainSeconds, currentGrandmaReactionSeconds, isGameOver, isNightComplete, isThreatActive, nightPressure, tutorialMode]);

  useEffect(() => {
    if (!isGrandmaVisible || isInstructionPromptVisible || isGameOver || isNightComplete) return;

    const repelTimer = window.setInterval(() => {
      const isRepellingGrandma =
        !isCorridorOpen &&
        heldItem === 'flashlight' &&
        isFlashlightOn &&
        isFlashlightAimedAtGrandma();

      setIsAimingAtGrandma(isRepellingGrandma);

      if (!isRepellingGrandma) {
        if (tutorialMode) return;

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
        const next = current + 0.04;
        if (next >= 1) {
          setIsGrandmaVisible(false);
          setGrandmaTimeLeft(grandmaReactionSeconds);
          setIsAimingAtGrandma(false);
          if (tutorialMode && tutorialPhase === 'grandmaActive') setTutorialPhase('stalkerIntro');
          return 0;
        }

        return next;
      });
    }, 100);

    return () => window.clearInterval(repelTimer);
  }, [flashOffset, flashlightToggleGrace, grandmaReactionSeconds, heldItem, isCorridorOpen, isFlashlightOn, isGameOver, isGrandmaVisible, isInstructionPromptVisible, isNightComplete, showMobileControls, tutorialMode, tutorialPhase]);

  useEffect(() => {
    if (!isStalkerVisible || isInstructionPromptVisible || isGameOver || isNightComplete) return;

    const stalkerTimer = window.setInterval(() => {
      const canStartMinigame = heldItem === 'cross' && isCrossAimedAtStalker();
      setIsAimingAtStalker(canStartMinigame);

      if (canStartMinigame && !isStalkerMinigameActive) {
        setIsStalkerMinigameActive(true);
        setStalkerSequence(createStalkerSequence());
        setStalkerButtonPosition(createStalkerButtonPosition());
        setStalkerKeyTimeLeft(stalkerMinigameTimeMs);
      }
    }, 100);

    return () => window.clearInterval(stalkerTimer);
  }, [flashOffset, heldItem, isGameOver, isInstructionPromptVisible, isNightComplete, isStalkerMinigameActive, isStalkerVisible, showMobileControls, stalkerMinigameTimeMs]);

  useEffect(() => {
    if (isStalkerVisible && !isGameOver && !isNightComplete) return;
    setIsAimingAtStalker(false);
  }, [isGameOver, isNightComplete, isStalkerVisible]);

  useEffect(() => {
    if (!isStalkerVisible || isInstructionPromptVisible || isStalkerMinigameActive || isGameOver || isNightComplete) return;

    const reactionTimer = window.setInterval(() => {
      setStalkerReactionLeft((current) => {
        const next = Math.max(0, current - 100);
        if (tutorialMode) return current;
        if (next === 0) triggerStalkerGameOver();
        return next;
      });
    }, 100);

    return () => window.clearInterval(reactionTimer);
  }, [isGameOver, isInstructionPromptVisible, isNightComplete, isStalkerMinigameActive, isStalkerVisible, tutorialMode]);

  useEffect(() => {
    if (!isStalkerVisible || isInstructionPromptVisible || !isStalkerMinigameActive || isGameOver || isNightComplete) return;

    function tickStalkerKey() {
      setStalkerKeyTimeLeft((current) => {
        const next = Math.max(0, current - 100);
        if (next === 0) {
          if (tutorialMode) return stalkerMinigameTimeMs;
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
  }, [isGameOver, isInstructionPromptVisible, isNightComplete, isStalkerMinigameActive, isStalkerVisible, stalkerMinigameTimeMs, tutorialMode]);

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
  const stalkerKeyTimeProgress = (stalkerKeyTimeLeft / stalkerMinigameTimeMs) * 100;
  const stalkerReactionProgress = (stalkerReactionLeft / currentStalkerReactionMs) * 100;
  const shouldShowGrandmaWarning = isGrandmaVisible && !isCorridorOpen && (isEasyMode || isAimingAtGrandma || grandmaRepelProgress > 0);
  const hasWonAllNights = currentNight >= finalNight;

  return (
    <section
      ref={roomScene}
      className={[
        'room-scene',
        showMobileControls ? 'room-scene-phone' : '',
        isFlashlightActive ? '' : 'room-blackout',
      ].filter(Boolean).join(' ')}
      style={style}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setFlashOffset({
          x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
          y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
        });
      }}
      aria-label={`Ночь ${currentNight}`}
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
      {heldItem === 'crowbar' && <div className="held-crowbar" aria-hidden="true" />}
      {isCrowbarSwinging && (
        <div
          className="crowbar-swing-fps"
          style={{ backgroundImage: `url(${crowbarSwingSheet})` }}
          aria-hidden="true"
        />
      )}
      {areMonstersEnabled && isBatteryThiefVisible && (
        <button className="battery-thief" type="button" ref={batteryThiefRef} onClick={hitBatteryThief} aria-label="Ударить воришку батарейки">
          <img src={batteryThief} alt="" />
        </button>
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
        <div className={showMobileControls ? 'stalker-minigame' : 'stalker-minigame stalker-minigame-keyboard'}>
          <strong>{stalkerInputLabel}</strong>
          <button
            className="stalker-letter-button"
            type="button"
            style={{ left: `${stalkerButtonPosition.x}%`, top: `${stalkerButtonPosition.y}%` }}
            onClick={pressStalkerButton}
            aria-label="РќР°Р¶РјРё РєРЅРѕРїРєСѓ"
          >
            ЖМИ
          </button>
          <i style={{ width: `${stalkerKeyTimeProgress}%` }} />
        </div>
      )}
      {areMonstersEnabled && isEasyMode && isStalkerVisible && !isStalkerMinigameActive && (
        <div className="stalker-warning">
          <span>{isAimingAtStalker ? 'Держи крест на нем' : 'Наведи крест на сталкера'}</span>
          <b style={{ width: `${stalkerReactionProgress}%` }} />
        </div>
      )}
      {isNightTitleVisible && <h1>{getNightTitle(currentNight)}</h1>}
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
      {areMonstersEnabled && isBatteryThiefVisible && (
        <div className="battery-thief-warning">
          <span>Бей ломом, пока он не забрал батарейку!</span>
          <b style={{ width: `${(batteryThiefTimeLeft / currentBatteryThiefReactionMs) * 100}%` }} />
        </div>
      )}
      {isTutorialPromptVisible && (
        <div className="tutorial-room-prompt" role="dialog" aria-label="Задание туториала">
          {tutorialPhase === 'grandmaIntro' && (
            <>
              <h2>Туториал</h2>
              <p>Если ты слышишь стуки или видишь в окне криповую бабку, туда надо посветить фонариком.</p>
              <button className="horror-button horror-button-primary" type="button" onClick={startTutorialGrandma}>
                Потренироваться
              </button>
            </>
          )}
          {tutorialPhase === 'stalkerIntro' && (
            <>
              <h2>Молодец!</h2>
              <p>Если с потолка стекает кровь, надо навести крест на сталкера и сыграть в мини-игру, чтобы прогнать его.</p>
              <button className="horror-button horror-button-primary" type="button" onClick={startTutorialStalker}>
                Потренироваться
              </button>
            </>
          )}
          {tutorialPhase === 'done' && (
            <>
              <h2>Молодец!</h2>
              <p>Теперь ты знаешь главное. Если появится маленький воришка батарейки, возьми лом на 3 и ударь его, пока он не забрал заряд.</p>
              <button className="horror-button horror-button-primary" type="button" onClick={onTutorialComplete}>
                Продолжить
              </button>
            </>
          )}
        </div>
      )}
      {isGrandmaInstructionVisible && (
        <div className="tutorial-room-prompt" role="dialog" aria-label="Подсказка">
          <h2>Опасность у окна</h2>
          <p>Если слышишь стуки или видишь в окне криповую бабку, посвети туда фонариком.</p>
          <button className="horror-button horror-button-primary" type="button" onClick={() => setHasReadGrandmaInstruction(true)}>
            Понятно
          </button>
        </div>
      )}
      {isStalkerInstructionVisible && (
        <div className="tutorial-room-prompt" role="dialog" aria-label="Подсказка">
          <h2>Кровь с потолка</h2>
          <p>Если с потолка стекает кровь, наведи крест на сталкера и сыграй в мини-игру, чтобы прогнать его.</p>
          <button className="horror-button horror-button-primary" type="button" onClick={() => setHasReadStalkerInstruction(true)}>
            Понятно
          </button>
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
          <h2>{hasWonAllNights ? 'Ты пережил все 5 ночей' : `Ночь ${currentNight} закончилась`}</h2>
          <button className="horror-button horror-button-primary" type="button" onClick={onBackToMenu}>
            {hasWonAllNights ? 'Вернуться к выбору ночи' : 'Выбрать следующую ночь'}
          </button>
        </div>
      )}
      <div className="item-hint">1 - фонарик / 2 - крест / 3 - лом</div>
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
        <button
          className={heldItem === 'crowbar' ? 'mobile-item-button mobile-item-button-active' : 'mobile-item-button'}
          type="button"
          onClick={() => chooseItem('crowbar')}
          aria-label="Лом"
        >
          <span className="crowbar-icon" />
        </button>
      </div>
        </div>
      )}
      <div className="room-hud">
        <span>Ночь {currentNight}/{finalNight}: {nightMinutes}:{nightSeconds}</span>
        <span>Фонарик: {isFlashlightOn ? 'Вкл' : 'Выкл'}</span>
        <span>Батарея: {Math.ceil(battery)}%</span>
        <span>Сложность: {difficultyName}</span>
      </div>
    </section>
  );
}
