// The opening on every visit, silent: the logo fades in while a dark red neon
// ring blooms outward from behind it, then it all closes back in reverse.
// Click, tap or press any key to skip. Under reduced motion it's a short,
// still fade.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandLogo } from './BrandLogo';

const FULL_MS = 4600;
const REDUCED_MS = 1400;
// The reverse bloom (rings close, logo fades, black lifts).
const LEAVE_MS = 1650;

export function Splash({ reducedMotion }: { reducedMotion: boolean }) {
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>('show');
  const skip = useRef<HTMLButtonElement>(null);

  const leave = useCallback(() => {
    setPhase((p) => (p === 'show' ? 'leaving' : p));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(leave, reducedMotion ? REDUCED_MS : FULL_MS);
    return () => window.clearTimeout(t);
  }, [leave, reducedMotion]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const t = window.setTimeout(() => setPhase('gone'), reducedMotion ? 200 : LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'show') return;
    skip.current?.focus({ preventScroll: true });
    const onKey = () => leave();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, leave]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`splash${phase === 'leaving' ? ' leaving' : ''}`}
      onClick={leave}
      role="dialog"
      aria-label="Performance Capability"
    >
      <div className="splash-ring outer" aria-hidden="true" />
      <div className="splash-ring" aria-hidden="true" />
      <div className="splash-ring inner" aria-hidden="true" />
      <BrandLogo className="splash-logo" />
      <button ref={skip} type="button" className="splash-skip" onClick={(e) => { e.stopPropagation(); leave(); }}>
        Enter ▸
      </button>
    </div>
  );
}
