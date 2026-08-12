import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import bloodyHand from '../assets/bloody-hand.jpg';
import scaryEyes from '../assets/scary-eyes.jpg';
import { RoomScene } from '../components/RoomScene';
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

type Screen = 'menu' | 'soundWarning' | 'story' | 'eyes' | 'room';

export function HomePage() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulties[1]);
  const [hoveredDifficulty, setHoveredDifficulty] = useState<Difficulty>(difficulties[1]);
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

  function startIntro() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setScreen('soundWarning');
  }

  function continueAfterSoundWarning() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setScreen('story');
    timers.current = [
      window.setTimeout(() => setScreen('eyes'), 6200),
      window.setTimeout(() => setScreen('room'), 6300),
    ];
  }

  function startRoom() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
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
      options: { redirectTo: window.location.origin },
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

  return (
    <main className={`horror-screen horror-screen-${screen}`}>
      {screen === 'menu' && (
        <>
          <img className="handprint handprint-left" src={bloodyHand} alt="" aria-hidden="true" />
          <img className="handprint handprint-right" src={bloodyHand} alt="" aria-hidden="true" />
          <section className="horror-menu" aria-label="Главное меню">
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

      {screen === 'soundWarning' && (
        <section className="story-panel sound-warning-panel" aria-label="Предупреждение">
          <h1>Включи звук</h1>
          <p>
            Лучше играть со звуком: он обязателен для игрового процесса. Некоторые опасности можно заметить только по звуку.
          </p>
          <button className="horror-button horror-button-primary story-start" type="button" onClick={continueAfterSoundWarning}>
            Продолжить
          </button>
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
          <p className="story-difficulty">Сложность: {selectedDifficulty.name}</p>
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
          onBackToMenu={() => setScreen('menu')}
        />
      )}
    </main>
  );
}
