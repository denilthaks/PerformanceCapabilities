// The homepage hero's art layer: the animated dragons and yin-yang, in place
// of the lobby picture, which stays underneath as the fallback (no WebGL, or
// while the scene loads). The 3D code and models load in their own chunk, so
// the hero text never waits for them. The entrance starts once the opening
// splash has gone; under reduced motion the scene is a single still frame.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../../app/game';
import { prefersReducedMotion } from '../../app/a11y';
import { RoomArt } from '../sprites';
import type { DragonScene } from './dragonScene';
import type { DragonAudio } from './dragonAudio';

type State = 'loading' | 'playing' | 'still' | 'fallback';

// The entrance plays once per page load; coming back to Home resumes the idle.
let entrancePlayed = false;

/** Resolves once the opening splash has gone (straight away if it isn't showing). */
function afterSplash(): Promise<void> {
  return new Promise((resolve) => {
    if (!document.querySelector('.splash')) { resolve(); return; }
    const mo = new MutationObserver(() => {
      if (!document.querySelector('.splash')) { mo.disconnect(); resolve(); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });
}

export function DragonHero() {
  const { progress } = useGame();
  const reduced = prefersReducedMotion(progress.settings);
  const soundAllowed = progress.settings.sound;
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DragonScene | null>(null);
  const audioRef = useRef<DragonAudio | null>(null);
  const [state, setState] = useState<State>('loading');
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let scene: DragonScene | null = null;
    let onScreen = true;
    let io: IntersectionObserver | null = null;
    // Stop drawing (and hold the sound) when the tab is hidden or the hero is scrolled away.
    const sync = () => {
      const paused = document.hidden || !onScreen;
      scene?.setPaused(paused);
      audioRef.current?.setPaused(paused);
    };
    Promise.all([import('./dragonScene'), import('./dragonAudio')])
      .then(async ([sceneModule, audioModule]) => {
        const created = await sceneModule.createDragonScene(host.current!, { still: reduced });
        if (cancelled) { created.dispose(); return; }
        scene = created;
        sceneRef.current = created;
        const audio = new audioModule.DragonAudio();
        audioRef.current = audio;
        created.onFrame = (t) => audio.update(t);
        await afterSplash();
        if (cancelled) return;
        created.start(!entrancePlayed && !reduced);
        entrancePlayed = true;
        setState(reduced ? 'still' : 'playing');
        io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
        io.observe(host.current!);
        document.addEventListener('visibilitychange', sync);
        if (import.meta.env.DEV) Object.assign(window, { __dragonHero: { scene: created, audio } });
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('Dragon hero unavailable, keeping the lobby art:', err);
        if (!cancelled) setState('fallback');
      });
    return () => {
      cancelled = true;
      io?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      audioRef.current?.dispose();
      audioRef.current = null;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [reduced]);

  // Turning sound off in Settings silences the dragons too.
  useEffect(() => {
    if (!soundAllowed && audioRef.current?.enabled) { audioRef.current.disable(); setSoundOn(false); }
  }, [soundAllowed]);

  const toggleSound = useCallback(async () => {
    const audio = audioRef.current, scene = sceneRef.current;
    if (!audio || !scene) return;
    if (audio.enabled) { audio.disable(); setSoundOn(false); return; }
    setSoundOn(true);
    try { await audio.enable(() => scene.time); } catch { setSoundOn(false); }
  }, []);

  return (
    <div className={`home-art dragon-hero is-${state}`} data-dragon-state={state}>
      <div className="dragon-fallback" aria-hidden="true"><RoomArt room="lobby" /></div>
      <div ref={host} className="dragon-stage" aria-hidden="true" />
      {state === 'playing' && soundAllowed && (
        <button type="button" className="dragon-sound" aria-pressed={soundOn} onClick={toggleSound}>
          <span aria-hidden="true">{soundOn ? '🔊' : '🔈'}</span> Dragon sound {soundOn ? 'on' : 'off'}
        </button>
      )}
    </div>
  );
}
