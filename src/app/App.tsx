import { useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from './game';
import { sectionOf, useRoute, type Route } from './router';
import { focusMainHeading, prefersReducedMotion } from './a11y';
import { installClickSounds, setSoundEnabled } from './audio';
import { setVoiceEnabled, stopSpeaking } from './voice';
import { Splash } from '../ui/Splash';
import { Embers, installTilt } from '../ui/motion';
import { NavBar } from '../ui/NavBar';
import { HomeScreen } from '../ui/screens/HomeScreen';
import { CreateScreen } from '../ui/screens/CreateScreen';
import { MapScreen } from '../ui/screens/MapScreen';
import { ZonesScreen, ZoneScreen } from '../ui/screens/ZoneScreens';
import { PlayScreen } from '../ui/play/PlayScreen';
import { DebriefScreen } from '../ui/screens/DebriefScreen';
import { PrinciplesScreen } from '../ui/screens/PrinciplesScreen';
import { AboutScreen } from '../ui/screens/AboutScreen';
import { ProgressScreen } from '../ui/screens/ProgressScreen';
import { SettingsScreen } from '../ui/screens/SettingsScreen';
import { Icon, Link } from '../ui/common';

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home': return <HomeScreen />;
    case 'create': return <CreateScreen />;
    case 'map': return <MapScreen />;
    case 'zones': return <ZonesScreen />;
    case 'zone': return <ZoneScreen id={route.id} />;
    case 'play': return <PlayScreen key={route.id} id={route.id} />;
    case 'debrief': return <DebriefScreen id={route.id} />;
    case 'principles': return <PrinciplesScreen />;
    case 'about': return <AboutScreen />;
    case 'progress': return <ProgressScreen />;
    case 'settings': return <SettingsScreen />;
    default:
      return (
        <section className="page narrow">
          <h1>Page not found</h1>
          <p>There's nothing at this address.</p>
          <Link to="/" className="btn btn-primary">Go home</Link>
        </section>
      );
  }
}

function ToastItem({ toast, onDismiss }: { toast: { id: number; title: string; text: string }; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), 3500);
    return () => window.clearTimeout(t);
  }, [toast.id, onDismiss]);
  return (
    <div className="toast">
      <Icon name="star" />
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.text}</p>
      </div>
      <button type="button" className="icon-btn" onClick={() => onDismiss(toast.id)}>
        <Icon name="close" size={16} /><span className="visually-hidden">Dismiss</span>
      </button>
    </div>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useGame();
  // One at a time, so they never bury the game; the rest follow.
  return (
    <div className="toasts">
      {toasts.slice(0, 1).map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
    </div>
  );
}

function Shell() {
  const route = useRoute();
  const { storageAvailable, progress } = useGame();
  const main = useRef<HTMLElement>(null);
  const key = route.name === 'not-found' ? route.path : 'id' in route ? `${route.name}/${route.id}` : route.name;
  // Decided once per visit, so changing settings mid-intro doesn't restart it.
  const [introReduced] = useState(() => prefersReducedMotion(progress.settings));

  useEffect(() => {
    window.scrollTo(0, 0);
    focusMainHeading(main.current);
    stopSpeaking();
  }, [key]);

  useEffect(() => installClickSounds(), []);
  const reduced = prefersReducedMotion(progress.settings);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  useEffect(() => installTilt(() => !reducedRef.current), []);
  useEffect(() => { setSoundEnabled(progress.settings.sound); }, [progress.settings.sound]);
  useEffect(() => { setVoiceEnabled(progress.settings.voice); }, [progress.settings.voice]);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); focusMainHeading(main.current); }}>Skip to content</a>
      <NavBar section={sectionOf(route)} />
      {!storageAvailable && (
        <p className="banner" role="status">Your browser is blocking local storage, so progress will be lost when you close this tab.</p>
      )}
      {route.name !== 'play' && !reduced && <Embers />}
      <main id="main" ref={main} className={`main main-${route.name}`}>
        {/* Keyed by route so each screen eases in as you arrive. */}
        <div key={key} className="route-in">
          <Screen route={route} />
        </div>
      </main>
      <footer className="footer">
        <p>
          <strong>Performance Capability: The Journey</strong> is an independent prototype inspired by Ben Benson's published Performance Capability framework.
          It has not been reviewed or endorsed by Performance Capability. Scenarios and characters are fictional.
        </p>
        <p>
          <Link to="/about">About Ben</Link> · <Link to="/principles">Principles and sources</Link> · <Link to="/settings">Settings</Link>
        </p>
      </footer>
      <Toasts />
      <Splash reducedMotion={introReduced} />
      <div id="announcer" className="visually-hidden" aria-live="polite" />
    </>
  );
}

export function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
