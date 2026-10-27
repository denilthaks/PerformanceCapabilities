// An explorable room. The player walks with the mouse (click the floor), touch,
// or the keyboard (arrows / WASD, E to interact), and walks over to whatever
// they choose to talk to or inspect. Movement is real: positions are tracked
// in room pixels and blocked by furniture.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Hotspot, Mood, RoomId } from '../engine/types';
import { characterById } from '../content/characters';
import { approachPoint, clampTarget, ROOMS, ROOM_H, ROOM_W, walkable } from './rooms';
import { PlayerSprite, RoomArt, type Facing } from './sprites';

const SPEED = 95; // room pixels per second
const REACH = 30;

export interface Bubble { characterId: string; text: string; mood: Mood }

interface Props {
  room: RoomId;
  look: string;
  start: { x: number; y: number };
  hotspots: Hotspot[];
  inspected: string[];
  activeId?: string | null;
  interactive: boolean;
  reducedMotion: boolean;
  onInteract?: (h: Hotspot) => void;
  bubbles?: Bubble[];
  /** Darken the room and show a title card (time skips). */
  caption?: string | null;
  children?: ReactNode;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function verb(h: Hotspot): string {
  if (h.secret) return 'Look closer';
  if (h.icon === 'call') return 'Pick up the phone';
  return h.kind === 'character' ? `Talk to ${h.label}` : `Examine the ${h.label.toLowerCase()}`;
}

export function RoomStage({ room, look, start, hotspots, inspected, activeId, interactive, reducedMotion, onInteract, bubbles, caption, children }: Props) {
  const def = ROOMS[room];
  const box = useRef<HTMLDivElement>(null);
  const pos = useRef({ ...start });
  const target = useRef<{ x: number; y: number } | null>(null);
  const pending = useRef<Hotspot | null>(null);
  const keys = useRef(new Set<string>());
  const frame = useRef(0);
  const last = useRef(0);
  const stuck = useRef(0);
  const [, force] = useState(0);
  const [facing, setFacing] = useState<Facing>('up');
  const [moving, setMoving] = useState(false);
  const interactRef = useRef(onInteract);
  interactRef.current = onInteract;

  const arrive = useCallback(() => {
    target.current = null;
    const h = pending.current;
    pending.current = null;
    if (h) interactRef.current?.(h);
  }, []);

  const tick = useCallback((t: number) => {
    const dt = Math.min(0.05, last.current ? (t - last.current) / 1000 : 0.016);
    last.current = t;
    let dx = 0;
    let dy = 0;
    const k = keys.current;
    if (k.size) {
      if (k.has('ArrowLeft') || k.has('a')) dx -= 1;
      if (k.has('ArrowRight') || k.has('d')) dx += 1;
      if (k.has('ArrowUp') || k.has('w')) dy -= 1;
      if (k.has('ArrowDown') || k.has('s')) dy += 1;
      if (dx || dy) { target.current = null; pending.current = null; }
    } else if (target.current) {
      dx = target.current.x - pos.current.x;
      dy = target.current.y - pos.current.y;
      if (Math.hypot(dx, dy) < 2) { arrive(); dx = 0; dy = 0; }
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const step = Math.min(SPEED * dt, target.current && !k.size ? len : Infinity);
      const nx = pos.current.x + (dx / len) * step;
      const ny = pos.current.y + (dy / len) * step;
      const before = { ...pos.current };
      if (walkable(def, nx, ny)) pos.current = { x: nx, y: ny };
      else if (walkable(def, nx, pos.current.y)) pos.current = { x: nx, y: pos.current.y };
      else if (walkable(def, pos.current.x, ny)) pos.current = { x: pos.current.x, y: ny };
      const moved = Math.hypot(pos.current.x - before.x, pos.current.y - before.y);
      if (moved < 0.01) {
        stuck.current += dt;
        // Blocked by furniture: stop here, and talk from where you stand.
        if (stuck.current > 0.25 && target.current) { stuck.current = 0; arrive(); }
      } else stuck.current = 0;
      if (Math.abs(dy) > Math.abs(dx) * 0.6) setFacing(dy < 0 ? 'up' : 'down');
      force((n) => n + 1);
    }
    const active = k.size > 0 || target.current !== null;
    setMoving(active && len > 0);
    if (active) frame.current = requestAnimationFrame(tick);
    else { frame.current = 0; last.current = 0; }
  }, [arrive, def]);

  const run = useCallback(() => {
    if (!frame.current) { last.current = 0; frame.current = requestAnimationFrame(tick); }
  }, [tick]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const walkTo = (x: number, y: number, h: Hotspot | null) => {
    const t = h ? approachPoint(def, h.x, h.y, pos.current) : clampTarget(def, x, y);
    pending.current = h;
    if (reducedMotion || Math.hypot(t.x - pos.current.x, t.y - pos.current.y) < REACH / 2) {
      pos.current = t;
      force((n) => n + 1);
      arrive();
      return;
    }
    target.current = t;
    run();
  };

  const toRoom = (clientX: number, clientY: number) => {
    const r = box.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * ROOM_W, y: ((clientY - r.top) / r.height) * ROOM_H };
  };

  const near = interactive
    ? hotspots
      .map((h) => {
        const a = approachPoint(def, h.x, h.y, pos.current);
        return { h, d: Math.min(Math.hypot(a.x - pos.current.x, a.y - pos.current.y), Math.hypot(h.x - pos.current.x, h.y + 16 - pos.current.y)) };
      })
      .filter((n) => n.d < REACH)
      .sort((a, b) => a.d - b.d)[0]?.h ?? null
    : null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive || e.target !== box.current) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(key)) {
      e.preventDefault();
      keys.current.add(key);
      run();
    } else if ((key === 'e' || key === 'Enter' || key === ' ') && near) {
      e.preventDefault();
      interactRef.current?.(near);
    }
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.current.delete(key);
  };

  return (
    <div
      ref={box}
      className={`room-stage${interactive ? ' interactive' : ''}${caption ? ' captioned' : ''}`}
      tabIndex={interactive ? 0 : -1}
      role="group"
      aria-roledescription="room"
      aria-label={`${def.name}.${interactive ? ' Click the floor to walk, or use the arrow keys and press E to interact.' : ''}`}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={() => keys.current.clear()}
    >
      <RoomArt room={room} />
      {interactive && (
        <div
          className="room-floor"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const p = toRoom(e.clientX, e.clientY);
            walkTo(p.x, p.y, null);
          }}
        />
      )}
      {interactive && hotspots.map((h) => {
        const seen = inspected.includes(h.id);
        const person = h.kind === 'character' && h.icon !== 'call';
        const w = person ? 22 : 26;
        const hgt = person ? 40 : 26;
        return (
          <button
            key={h.id}
            type="button"
            className={`hotspot${person ? ' person' : ' thing'}${seen ? ' seen' : ''}${h.secret ? ' secret' : ''}${activeId === h.id ? ' active' : ''}`}
            style={{ left: pct(h.x - w / 2, ROOM_W), top: pct(h.y - hgt / 2, ROOM_H), width: pct(w, ROOM_W), height: pct(hgt, ROOM_H) }}
            aria-label={h.secret ? 'Something catches your eye' : `${verb(h)}${seen ? ' (again)' : ''}`}
            onClick={(e) => { e.stopPropagation(); walkTo(h.x, h.y, h); }}
          >
            {!seen && !h.secret && <span className={`marker ${person ? 'talk' : 'look'}`} aria-hidden="true">{h.icon === 'call' ? '☎' : person ? '!' : '?'}</span>}
            <span className="tag" aria-hidden="true">{h.secret ? '…' : h.label}</span>
          </button>
        );
      })}
      {(bubbles ?? []).map((b, i) => {
        const c = characterById(b.characterId);
        if (!c || c.sprite.room !== room) return null;
        return (
          <div
            key={b.characterId}
            className={`bubble mood-${b.mood}${c.sprite.x > 330 ? ' left' : ''}`}
            style={{ left: pct(c.sprite.x, ROOM_W), top: pct(c.sprite.y - 10, ROOM_H), animationDelay: `${i * 350}ms` }}
            aria-hidden="true"
          >
            {b.text}
          </div>
        );
      })}
      <PlayerSprite
        look={look}
        facing={facing}
        className={`player-sprite${moving ? ' walking' : ''}`}
        style={{ left: pct(pos.current.x, ROOM_W), top: pct(pos.current.y, ROOM_H), width: pct(19, ROOM_W) }}
      />
      {near && !activeId && (
        <div className="prompt" style={{ left: pct(pos.current.x, ROOM_W), top: pct(pos.current.y - 44, ROOM_H) }} aria-live="polite">
          <kbd>E</kbd> {verb(near)}
        </div>
      )}
      {caption && <div className="room-caption"><span>{caption}</span></div>}
      {children}
    </div>
  );
}
