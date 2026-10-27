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
 *
 * The card's flat (untilted) rectangle is measured once when the pointer
 * arrives and used until the pointer leaves it. Measuring the tilted card
 * instead made its edges jitter: tilting moves the edge out from under the
 * pointer, the card resets, the edge comes back, and so on.
 */
export function installTilt(enabled: () => boolean): () => void {
  let current: HTMLElement | null = null;
  let rect: DOMRect | null = null;
  const reset = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
    el.classList.remove('tilting');
  };
  const inside = (r: DOMRect, x: number, y: number) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !enabled()) return;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tilt]') ?? null;
    const stillInside = Boolean(current && rect && inside(rect, e.clientX, e.clientY));
    // Switch to a new card when the pointer has really left the current one,
    // or moved onto a card nested inside it (a principle card on its slab).
    if (el && el !== current && (!stillInside || current!.contains(el))) {
      reset(current);
      current = el;
      rect = flatRect(el);
    } else if (!stillInside) {
      reset(current);
      current = null;
      rect = null;
      return;
    }
    if (!current || !rect) return;
    const px = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
    const py = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));
    current.style.setProperty('--ry', `${(px * 10).toFixed(2)}deg`);
    current.style.setProperty('--rx', `${(-py * 8).toFixed(2)}deg`);
    current.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
    current.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
    current.classList.add('tilting');
  };
  const forget = () => { reset(current); current = null; rect = null; };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', forget);
  window.addEventListener('scroll', forget, { passive: true });
  return () => {
    document.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', forget);
    window.removeEventListener('scroll', forget);
    forget();
  };
}

/** The element's on-screen rectangle as if it weren't tilted. */
function flatRect(el: HTMLElement): DOMRect {
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return new DOMRect(cx - w / 2, cy - h / 2, w, h);
}
