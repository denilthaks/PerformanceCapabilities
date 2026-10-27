// The four floors of Halcyon Tower: pixel-art room markup (480 × 300 room
// pixels), plus where the player can walk in each.

import type { RoomId } from '../engine/types';
import lobby from '../assets/rooms/lobby.svg?raw';
import vault from '../assets/rooms/vault.svg?raw';
import lounge from '../assets/rooms/lounge.svg?raw';
import executive from '../assets/rooms/executive.svg?raw';

export const ROOM_W = 480;
export const ROOM_H = 300;

export interface Rect { x: number; y: number; w: number; h: number }

export interface RoomDef {
  id: RoomId;
  name: string;
  /** Inner SVG markup, from the supplied design assets. */
  markup: string;
  /** Where feet may go: everything inside `floor` and outside every obstacle. */
  floor: Rect;
  obstacles: Rect[];
}

export const ROOMS: Record<RoomId, RoomDef> = {
  lobby: {
    id: 'lobby', name: 'Grand Lobby', markup: lobby,
    floor: { x: 26, y: 104, w: 428, h: 190 },
    obstacles: [
      { x: 166, y: 104, w: 148, h: 52 }, // reception desk
      { x: 102, y: 164, w: 36, h: 26 }, { x: 342, y: 164, w: 36, h: 26 }, // gates
      { x: 20, y: 196, w: 84, h: 52 }, // sofa and coffee table
      { x: 450, y: 240, w: 30, h: 40 }, // plant
    ],
  },
  vault: {
    id: 'vault', name: 'Data Vault', markup: vault,
    floor: { x: 26, y: 102, w: 428, h: 192 },
    obstacles: [
      { x: 38, y: 108, w: 164, h: 44 }, { x: 278, y: 108, w: 164, h: 44 }, // row A
      { x: 38, y: 194, w: 164, h: 48 }, { x: 278, y: 194, w: 164, h: 48 }, // row B
      { x: 204, y: 200, w: 72, h: 54 }, // holo screen and console
      { x: 230, y: 254, w: 20, h: 32 }, // Rafael's chair
    ],
  },
  lounge: {
    id: 'lounge', name: 'Break Lounge', markup: lounge,
    floor: { x: 26, y: 100, w: 428, h: 194 },
    obstacles: [
      { x: 108, y: 150, w: 64, h: 40 }, // table 1
      { x: 308, y: 196, w: 64, h: 40 }, // table 2
      { x: 16, y: 240, w: 110, h: 30 }, // sofa
      { x: 444, y: 232, w: 36, h: 44 }, // plant
    ],
  },
  executive: {
    id: 'executive', name: 'Executive Suite', markup: executive,
    floor: { x: 26, y: 102, w: 428, h: 192 },
    obstacles: [
      { x: 158, y: 100, w: 164, h: 68 }, // desk and chair
      { x: 182, y: 166, w: 28, h: 28 }, { x: 270, y: 166, w: 28, h: 28 }, // guest chairs
      { x: 14, y: 222, w: 94, h: 28 }, // chess lounge
      { x: 386, y: 176, w: 32, h: 36 }, // globe
      { x: 444, y: 228, w: 36, h: 48 }, // plant
    ],
  },
};

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** Can the player's feet stand here? (A small footprint, not a single point.) */
export function walkable(room: RoomDef, x: number, y: number): boolean {
  if (!inside(room.floor, x, y)) return false;
  const pts: [number, number][] = [[x - 4, y], [x + 4, y], [x, y - 3]];
  return !room.obstacles.some((o) => pts.some(([px, py]) => inside(o, px, py)));
}

/**
 * Where to stand when interacting with something at (x, y): beside a person
 * (on the side you're coming from), or in front of an object on a wall.
 */
export function approachPoint(room: RoomDef, x: number, y: number, from?: { x: number; y: number }): { x: number; y: number } {
  const side = from && from.x > x ? 1 : -1;
  const feet = Math.max(y + 16, room.floor.y + 8);
  const preferred: [number, number][] = [[x + side * 20, feet], [x - side * 20, feet], [x, feet + 14]];
  for (const [cx, cy] of preferred) if (walkable(room, cx, cy)) return { x: cx, y: cy };
  for (let d = 4; d <= 160; d += 4) {
    const candidates: [number, number][] = [
      [x, feet + d], [x - d, feet], [x + d, feet], [x - d, feet + d], [x + d, feet + d], [x, feet - d],
    ];
    for (const [cx, cy] of candidates) if (walkable(room, cx, cy)) return { x: cx, y: cy };
  }
  return { x: room.floor.x + room.floor.w / 2, y: room.floor.y + room.floor.h - 6 };
}

/** Clamp a click to the nearest walkable target. */
export function clampTarget(room: RoomDef, x: number, y: number): { x: number; y: number } {
  const cx = Math.min(room.floor.x + room.floor.w, Math.max(room.floor.x, x));
  const cy = Math.min(room.floor.y + room.floor.h, Math.max(room.floor.y, y));
  return walkable(room, cx, cy) ? { x: cx, y: cy } : approachPoint(room, cx, cy - 16);
}
