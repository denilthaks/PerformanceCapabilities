// Loads the Three.js ambient world only when it is wanted and supported.
// Falls back to a CSS backdrop when WebGL is unavailable, switched off or lost.

import { useEffect, useRef, useState } from 'react';
import { useGame } from '../app/game';
import { prefersReducedMotion } from '../app/a11y';
import { webglAvailable, lowPower } from './capabilities';
import type { AmbientHandle } from './ambient-scene';

export type AmbientStatus = 'off' | 'loading' | 'running' | 'fallback';

export function Ambient({ lit }: { lit: number }) {
  const { progress } = useGame();
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<AmbientHandle | null>(null);
  const [status, setStatus] = useState<AmbientStatus>('loading');
  const graphics = progress.settings.graphics;
  const reduced = prefersReducedMotion(progress.settings);

  useEffect(() => {
    if (graphics === 'off') { setStatus('off'); return; }
    if (!webglAvailable()) { setStatus('fallback'); return; }
    let cancelled = false;
    setStatus('loading');
    import('./ambient-scene')
      .then(({ createAmbient }) => {
        if (cancelled || !canvas.current) return;
        handle.current = createAmbient(canvas.current, {
          reducedMotion: reduced,
          lowPower: graphics === 'auto' && lowPower(),
          litBeacons: lit,
          onContextLost: () => setStatus('fallback'),
        });
        setStatus('running');
      })
      .catch(() => { if (!cancelled) setStatus('fallback'); });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
    // The lit count is updated separately below, without rebuilding the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphics, reduced]);

  useEffect(() => { handle.current?.setLit(lit); }, [lit]);

  return (
    <div className={`ambient ambient-${status}`} aria-hidden="true" data-ambient={status}>
      <div className="ambient-fallback" />
      {status !== 'off' && status !== 'fallback' && <canvas ref={canvas} className="ambient-canvas" />}
      <div className="ambient-vignette" />
    </div>
  );
}
