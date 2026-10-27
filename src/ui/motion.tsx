// Ambient motion shared by every screen: drifting embers behind the page and
// a 3D tilt on anything marked data-tilt. Both stay off under reduced motion.

import { useMemo } from 'react';

/** Glowing embers rising slowly behind the content. Purely decorative. */
export function Embers({ count = 26 }: { count?: number }) {
  const embers = useMemo(() => {
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: count }, (_, i) => ({
      left: `${rnd() * 100}%`,
      size: 2 + rnd() * 3,
      dur: 9 + rnd() * 12,
      delay: -rnd() * 20,
      drift: (rnd() - 0.5) * 80,
      gold: i % 6 === 0,
    }));
  }, [count]);
  return (
    <div className="embers" aria-hidden="true">
      {embers.map((e, i) => (
        <span
          key={i}
          className={`ember${e.gold ? ' gold' : ''}`}
          style={{ left: e.left, width: e.size, height: e.size, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`, '--drift': `${e.drift}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Tilt [data-tilt] elements towards the pointer. Uses event delegation, so
 * cards rendered later need no setup. Returns a cleanup function.
 */
export function installTilt(enabled: () => boolean): () => void {
  let current: HTMLElement | null = null;
  const reset = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
    el.classList.remove('tilting');
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !enabled()) return;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tilt]') ?? null;
    if (el !== current) { reset(current); current = el; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
    el.classList.add('tilting');
  };
  const onLeave = () => { reset(current); current = null; };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    document.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    reset(current);
  };
}
