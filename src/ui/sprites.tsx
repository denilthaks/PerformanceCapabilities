// Pixel sprites and portraits. The player sprite follows the proportions and
// palette of the walking figure in the supplied lobby art; portraits of the
// cast are cropped straight from the room art, so every face matches the world.

import type { RoomId } from '../engine/types';
import { characterById } from '../content/characters';
import { ROOMS } from './rooms';

// The four player looks live in looks.ts (no React), so plain pages can use them too.
import { PLAYER_LOOKS, type Palette } from './looks';
export { PLAYER_LOOKS, type Palette };

export type Facing = 'up' | 'down';

function Back({ p }: { p: Palette }) {
  return (
    <>
      <path d="M2 34h12v2h-12z" fill="#030204" opacity="0.6" />
      <path d="M3 11h10v11h-10z M1 12h2v9h-2z M13 12h2v9h-2z" fill={p.suit} />
      <path d="M1 12h1v9h-1z M4 11h2v1h-2z M10 11h2v1h-2z" fill={p.suitHi} />
      <path d="M3 13h1v8h-1z M12 13h1v8h-1z M14 12h1v9h-1z M8 14h1v8h-1z" fill={p.suitShade} />
      <path d="M6 10h4v1h-4z" fill="#d9dbe2" />
      <path d="M1 21h2v2h-2z M13 21h2v2h-2z M3 4h1v3h-1z M12 4h1v3h-1z M6 9h4v1h-4z" fill={p.skin} />
      <path d="M4 0h8v9h-8z M3 1h1v3h-1z M12 1h1v3h-1z" fill={p.hair} />
      <path d="M4 8h8v1h-8z M5 1h2v1h-2z" fill={p.hairShade} />
      <path d="M3 22h10v1h-10z" fill={p.suitShade} />
      <path d="M3 23h10v2h-10z M3 25h4v7h-4z M9 25h4v6h-4z" fill={p.suit} />
      <path d="M6 25h1v7h-1z M7 23h2v2h-2z" fill={p.suitShade} />
      <path d="M2 32h5v2h-5z M9 31h5v2h-5z" fill="#050407" />
      <path d="M14 22h5v6h-5z" fill={p.suitHi} />
      <path d="M14 22h5v1h-5z M16 21h1v1h-1z" fill="#8f6a1e" />
      <path d="M16 24h1v1h-1z" fill="#e0b34a" />
    </>
  );
}

function Front({ p }: { p: Palette }) {
  return (
    <>
      <path d="M2 34h12v2h-12z" fill="#030204" opacity="0.6" />
      <path d="M3 11h10v11h-10z M1 12h2v9h-2z M13 12h2v9h-2z" fill={p.suit} />
      <path d="M1 12h1v9h-1z M3 11h2v1h-2z M11 11h2v1h-2z" fill={p.suitHi} />
      <path d="M6 11h1v11h-1z M9 11h1v11h-1z" fill={p.suitShade} />
      <path d="M7 10h2v1h-2z M7 11h2v1h-2z" fill="#d9dbe2" />
      <path d="M7 12h2v5h-2z" fill={p.accent} />
      <path d="M4 3h8v6h-8z M7 9h2v1h-2z M1 21h2v2h-2z M13 21h2v2h-2z" fill={p.skin} />
      <path d="M6 5h1v1h-1z M9 5h1v1h-1z" fill="#0a090d" />
      <path d="M7 7h2v1h-2z" fill={p.hairShade} opacity="0.6" />
      <path d="M4 0h8v3h-8z M3 1h1v5h-1z M12 1h1v5h-1z" fill={p.hair} />
      <path d="M4 3h2v1h-2z M10 3h2v1h-2z" fill={p.hairShade} />
      <path d="M3 22h10v1h-10z" fill={p.suitShade} />
      <path d="M3 23h10v2h-10z M3 25h4v7h-4z M9 25h4v7h-4z" fill={p.suit} />
      <path d="M7 23h2v2h-2z" fill={p.suitShade} />
      <path d="M2 32h5v2h-5z M9 32h5v2h-5z" fill="#050407" />
    </>
  );
}

export function PlayerSprite({ look, facing = 'down', className, style }: { look: string; facing?: Facing; className?: string; style?: React.CSSProperties }) {
  const p = (PLAYER_LOOKS[look] ?? PLAYER_LOOKS.ember).palette;
  return (
    <svg className={`pixel ${className ?? ''}`} viewBox="0 0 19 36" style={style} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      {facing === 'up' ? <Back p={p} /> : <Front p={p} />}
    </svg>
  );
}

/** A head-and-shoulders crop of the room art. */
function RoomCrop({ room, x, y, size, label }: { room: RoomId; x: number; y: number; size: number; label?: string }) {
  return (
    <svg
      className="pixel portrait"
      width={size}
      height={size}
      viewBox={`${x - 10} ${y - 7} 20 20`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
      dangerouslySetInnerHTML={{ __html: ROOMS[room].markup }}
    />
  );
}

export function Portrait({ characterId, size = 56, label }: { characterId: string; size?: number; label?: string }) {
  const c = characterById(characterId);
  if (!c) return null;
  return <span className="portrait-frame" style={{ width: size, height: size }}><RoomCrop room={c.sprite.room} x={c.sprite.x} y={c.sprite.y} size={size} label={label} /></span>;
}

export function PlayerPortrait({ look, size = 56 }: { look: string; size?: number }) {
  return (
    <span className="portrait-frame player" style={{ width: size, height: size }}>
      <PlayerSprite look={look} style={{ width: size * 0.95, height: 'auto', marginTop: size * 0.12 }} />
    </span>
  );
}

/** The full room, as a picture. `crop` selects a horizontal band (for thumbnails). */
export function RoomArt({ room, crop, className, label }: { room: RoomId; crop?: [number, number]; className?: string; label?: string }) {
  const [y0, h] = crop ?? [0, 300];
  return (
    <svg
      className={`pixel room-art ${className ?? ''}`}
      viewBox={`0 ${y0} 480 ${h}`}
      preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
      dangerouslySetInnerHTML={{ __html: ROOMS[room].markup }}
    />
  );
}
