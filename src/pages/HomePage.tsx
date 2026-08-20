import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import bloodyHand from '../assets/bloody-hand.jpg';
import scaryEyes from '../assets/scary-eyes.jpg';
import { RoomScene } from '../components/RoomScene';
import {
  loadAccountUnlockedNight,
  loadGuestUnlockedNight,
  saveAccountUnlockedNight,
  saveGuestUnlockedNight,
} from '../lib/progress';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Difficulty = {
  name: 'Легко' | 'Средний' | 'Сложный' | 'Кошмар';
  tagline: string;
  stats: string[];
  batteryDrainSeconds: number;
  grandmaReactionSeconds: number;
};

const difficulties: Difficulty[] = [
  {
    name: 'Легко',
    tagline: 'Монстры приходят редко, есть больше времени на реакцию.',
    stats: ['Фонарик: -1% каждые 4 секунды', 'Опасность: низкая', 'Время на отпугивание: длинное'],
    batteryDrainSeconds: 4,
    grandmaReactionSeconds: 5,
  },
  {
    name: 'Средний',
    tagline: 'Для сбалансированного опыта.',
    stats: ['Фонарик: -1% каждые 3 секунды', 'Опасность: обычная', 'Время на отпугивание: среднее'],
    batteryDrainSeconds: 3,
    grandmaReactionSeconds: 3.5,
  },
  {
    name: 'Сложный',
    tagline: 'Монстры появляются чаще, а батарейку придется беречь.',
    stats: ['Фонарик: -1% каждые 2 секунды', 'Опасность: высокая', 'Время на отпугивание: короткое'],
    batteryDrainSeconds: 2,
    grandmaReactionSeconds: 2,
  },
  {
    name: 'Кошмар',
    tagline: 'Для самых смелых.',
    stats: ['Фонарик: -1% каждую секунду', 'Монстры приходят очень часто', 'Время на отпугивание: очень короткое'],
    batteryDrainSeconds: 1,
    grandmaReactionSeconds: 1.5,
  },
];

type Screen = 'menu' | 'nightSelect' | 'tutorialPrompt' | 'tutorialWarning' | 'tutorial' | 'story' | 'eyes' | 'room';
type DeviceMode = 'computer' | 'phone';

export function HomePage() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulties[1]);
  const [hoveredDifficulty, setHoveredDifficulty] = useState<Difficulty>(difficulties[1]);
  const [selectedNight, setSelectedNight] = useState(1);
  const [unlockedNight, setUnlockedNight] = useState(1);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('computer');
  const [isTutorialRun, setIsTutorialRun] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setIsGuest(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isGuest) {
      const guestNight = loadGuestUnlockedNight();
      setUnlockedNight(guestNight);
      setSelectedNight((current) => Math.min(current, guestNight));
      return;
    }

    if (!session) {
      setUnlockedNight(1);
      setSelectedNight(1);
      return;
    }

    loadAccountUnlockedNight()
      .then((accountNight) => {
        setUnlockedNight(accountNight);
        setSelectedNight((current) => Math.min(current, accountNight));
      })
      .catch((error: Error) => {
        setLoginMessage(error.message);
      });
  }, [isGuest, session]);

  const unlockNight = useCallback((night: number) => {
    setUnlockedNight((current) => {
      const nextNight = Math.max(current, night);
      setSelectedNight(Math.min(5, nextNight));

      if (isGuest) {
        saveGuestUnlockedNight(nextNight);
      } else if (session) {
        void saveAccountUnlockedNight(nextNight).catch((error: Error) => {
          setLoginMessage(error.message);
        });
      }

      return nextNight;
    });
  }, [isGuest, session]);

  function startIntro() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setScreen('nightSelect');
  }

  function chooseNight(night: number) {
    if (night > unlockedNight) return;
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setSelectedNight(night);
    setIsTutorialRun(false);
    setScreen('story');
    timers.current = [
      window.setTimeout(() => setScreen('eyes'), 6200),
      window.setTimeout(() => setScreen('room'), 6300),
    ];
  }

  function startTutorialFromNightSelect() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setSelectedNight(1);
    setScreen('tutorialPrompt');
  }

  function openTutorial() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setIsTutorialRun(true);
    setScreen('eyes');
    timers.current = [window.setTimeout(() => setScreen('room'), 100)];
  }

  function declineTutorial() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setScreen('tutorialWarning');
  }

  function continueAfterTutorial() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setIsTutorialRun(false);
    setScreen('story');
    timers.current = [
      window.setTimeout(() => setScreen('eyes'), 6200),
      window.setTimeout(() => setScreen('room'), 6300),
    ];
  }

  function startRoom() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setIsTutorialRun(false);
    setScreen('eyes');
    timers.current = [window.setTimeout(() => setScreen('room'), 100)];
  }

  async function signInWithGoogle() {
    setLoginMessage('');

    if (!isSupabaseConfigured) {
      setLoginMessage('Supabase не настроен. Пока можно играть как гость.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) setLoginMessage(error.message);
  }

  async function signOut() {
    setLoginMessage('');

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLoginMessage(error.message);
        return;
      }
    }

    setSession(null);
    setIsGuest(false);
    setIsDifficultyOpen(false);
  }

  const canPlay = Boolean(session) || isGuest;
  const authStatusText = session?.user.email
    ? `Успешно вошли как ${session.user.email}`
    : isGuest
      ? 'Играете как гость'
      : '';

  return (
    <main className={`horror-screen horror-screen-${screen}`}>
      {screen === 'menu' && (
        <>
          <img className="handprint handprint-left" src={bloodyHand} alt="" aria-hidden="true" />
          <img className="handprint handprint-right" src={bloodyHand} alt="" aria-hidden="true" />
          <section className="horror-menu" aria-label="Главное меню">
            {authStatusText && <p className={session ? 'menu-auth-status menu-auth-status-account' : 'menu-auth-status'}>{authStatusText}</p>}
            <h1 className="blood-title">Motel Horror</h1>
            <div className="menu-actions">
              {canPlay && (
                <>
              <button className="horror-button horror-button-primary" type="button" onClick={startIntro}>
                Играть
              </button>
              <button className="horror-button" type="button" onClick={() => setIsDifficultyOpen((current) => !current)}>
                Выбрать сложность
              </button>
              <div className="device-choice" aria-label="Device choice">
                <button
                  className={deviceMode === 'computer' ? 'device-choice-button device-choice-button-active' : 'device-choice-button'}
                  type="button"
                  onClick={() => setDeviceMode('computer')}
                >
                  Компьютер
                </button>
                <button
                  className={deviceMode === 'phone' ? 'device-choice-button device-choice-button-active' : 'device-choice-button'}
                  type="button"
                  onClick={() => setDeviceMode('phone')}
                >
                  Телефон
                </button>
              </div>
                </>
              )}
              <button className="horror-button" type="button" onClick={() => setIsLoginOpen((current) => !current)}>
                Войти
              </button>
            </div>

            {isLoginOpen && (
              <div className="login-panel" aria-label="Вход">
                {session?.user.email && <p className="login-status">Вы вошли как {session.user.email}</p>}
                {isGuest && <p className="login-status">Вы играете как гость</p>}
                {session && (
                  <button className="login-button" type="button" onClick={signOut}>
                    Выйти из аккаунта
                  </button>
                )}
                <button className="login-button login-button-google" type="button" onClick={signInWithGoogle} hidden={Boolean(session)}>
                  Войти через Google
                </button>
                <button
                  className="login-button"
                  type="button"
                  hidden={Boolean(session)}
                  onClick={() => {
                    setLoginMessage('');
                    setIsGuest(true);
                    setIsLoginOpen(false);
                  }}
                >
                  Играть как гость
                </button>
                {loginMessage && <p>{loginMessage}</p>}
              </div>
            )}

            {canPlay && isDifficultyOpen && (
              <div className="difficulty-layout" aria-label="Выбор сложности">
                <div className="difficulty-menu">
                  {difficulties.map((difficulty) => (
                    <button
                      className="difficulty-button"
                      key={difficulty.name}
                      type="button"
                      onClick={() => setSelectedDifficulty(difficulty)}
                      onFocus={() => setHoveredDifficulty(difficulty)}
                      onMouseEnter={() => setHoveredDifficulty(difficulty)}
                    >
                      <span>{difficulty.name}</span>
                      {selectedDifficulty.name === difficulty.name && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
                <aside className="difficulty-stats">
                  <h2>{hoveredDifficulty.name}</h2>
                  <p>{hoveredDifficulty.tagline}</p>
                  <ul>
                    {hoveredDifficulty.stats.map((stat) => (
                      <li key={stat}>{stat}</li>
                    ))}
                  </ul>
                </aside>
              </div>
            )}

          </section>
        </>
      )}

      {screen === 'nightSelect' && (
        <section className="night-select-panel" aria-label="Выбор ночи">
          <h1>Выбери ночь</h1>
          <div className="night-choice night-choice-screen">
            {[1, 2, 3, 4, 5].map((night) => {
              const isLocked = night > unlockedNight;
              return (
                <button
                  className={[
                    'night-choice-button',
                    selectedNight === night ? 'night-choice-button-active' : '',
                    isLocked ? 'night-choice-button-locked' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  key={night}
                  disabled={isLocked}
                  onClick={() => chooseNight(night)}
                >
                  <span>{night}</span>
                  <small>{isLocked ? 'закрыто' : 'открыто'}</small>
                </button>
              );
            })}
          </div>
          <div className="night-select-actions">
            <button className="horror-button" type="button" onClick={() => setScreen('menu')}>
              Назад
            </button>
            <button className="horror-button" type="button" onClick={startTutorialFromNightSelect}>
              Туториал
            </button>
          </div>
        </section>
      )}

      {screen === 'tutorialPrompt' && (
        <section className="story-panel tutorial-panel tutorial-choice-panel" aria-label="Выбор туториала">
          <h1>Хотите пройти туториал?</h1>
          <p>Он быстро покажет, как выживать, пользоваться предметами и защищаться от монстров.</p>
          <div className="tutorial-actions">
            <button className="horror-button horror-button-primary" type="button" onClick={openTutorial}>
              Пройти туториал
            </button>
            <button className="horror-button" type="button" onClick={declineTutorial}>
              Отказаться
            </button>
          </div>
        </section>
      )}

      {screen === 'tutorialWarning' && (
        <section className="story-panel tutorial-panel tutorial-choice-panel" aria-label="Предупреждение о туториале">
          <h1>Туториал рекомендуется</h1>
          <p>При первом прохождении настоятельно рекомендуется пройти туториал, иначе можно не понять, как отпугивать бабку и сталкера.</p>
          <div className="tutorial-actions">
            <button className="horror-button horror-button-primary" type="button" onClick={openTutorial}>
              Пройти туториал
            </button>
            <button className="horror-button" type="button" onClick={continueAfterTutorial}>
              Все равно пропустить
            </button>
          </div>
        </section>
      )}

      {screen === 'story' && (
        <section className="story-panel story-panel-animated" aria-label="Предыстория">
          <h1>Motel Horror</h1>
          <p>
            Ночь застала тебя в дороге. Дождь бил по стеклу, бензин почти закончился, и единственным
            светом впереди оказалась вывеска старого мотеля.
          </p>
          <p>
            Ты снял комнату у домохозяйки-бабушки. Она улыбалась слишком долго, говорила слишком тихо
            и почему-то знала твое имя до того, как ты его назвал.
          </p>
          <p>
            За стенами что-то скребется. Телефон молчит. Дверь будто стала тяжелее. Твоя цель -
            выжить 5 ночей.
          </p>
          <button className="horror-button horror-button-primary story-start" type="button" onClick={startRoom}>
            Начать
          </button>
        </section>
      )}

      {screen === 'eyes' && <img className="eyes-flash" src={scaryEyes} alt="" aria-hidden="true" />}

      {screen === 'room' && (
        <RoomScene
          difficultyName={selectedDifficulty.name}
          batteryDrainSeconds={selectedDifficulty.batteryDrainSeconds}
          grandmaReactionSeconds={selectedDifficulty.grandmaReactionSeconds}
          startNight={selectedNight}
          showMobileControls={deviceMode === 'phone'}
          tutorialMode={isTutorialRun}
          onTutorialComplete={continueAfterTutorial}
          onBackToMenu={() => {
            setIsTutorialRun(false);
            setScreen('nightSelect');
          }}
          onNightUnlocked={unlockNight}
        />
      )}
    </main>
  );
}
