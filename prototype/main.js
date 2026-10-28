// Performance Capability: The Journey, nine-screen prototype.
//
// A playable vertical slice of the Ground floor ("The Front Gate") styled to
// the approved concept board. All story content, scoring, medals, XP, room
// art and walk/collision rules are imported from the main game's source, so
// nothing here is a re-typed copy. Everything is 2D: depth is simulated with
// layered parallax (title) and a follow camera (lobby); there is no 3D engine.

import { frontGate as SCENARIO } from '../src/content/scenarios/front-gate';
import { characterById } from '../src/content/characters';
import { ZONES } from '../src/content/zones';
import { resolveReference } from '../src/content/principles';
import {
  advance, availableEvidence, blocker, choose, chosenOption, currentStage, decisionStages, exploreStages, inspect,
  linesFor, MEDAL_RULES, medalChecks, medalFor, missingRequired, optionAvailable, reflect, score, startRun,
  visibleHotspots, XP_RULES,
} from '../src/engine/scenario-engine';
import { AVATARS, cleanName, MAX_NAME_LENGTH } from '../src/engine/progress-store';
import { approachPoint, clampTarget, ROOMS, walkable } from '../src/ui/rooms';
import { PLAYER_LOOKS } from '../src/ui/looks';
import { load, persist, recordFinish, resumeScreen, startFresh } from './state.js';

const ROOM = ROOMS[SCENARIO.room];
const ZONE = ZONES.find((z) => z.scenarioIds.includes(SCENARIO.id));
const EXPLORE = exploreStages(SCENARIO)[0];
const CTX = { flags: new Set() };
const SPEED = 95; // room pixels per second, as in the main game
const REACH = 30;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = (() => { try { return window.localStorage; } catch { return null; } })();

// ---------------------------------------------------------------- state

const S = {
  save: load(store, SCENARIO),
  screen: 'title',
  mobile: false,
  W: 614,
  H: 352,
  select: { look: 'ember', name: '', err: '' },
  talk: null, // { h, lines, i }
  intro: null, // index into the arrival lines while the intro plays
  nb: { sel: null, fresh: null },
  dec: { sel: -1, err: '' },
  refl: { sel: new Set(), note: '', err: '' },
  toast: null,
};
const run = () => S.save.run;
function setRun(next) { S.save = { ...S.save, run: next }; persist(store, S.save); }

// ---------------------------------------------------------------- art

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RED = '#de3b27';
const STARS = [[39, 30], [68, 30], [26, 52], [53, 52], [80, 52], [39, 75], [68, 75]];
function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
// Geometry, colours and type from src/ui/BrandLogo.tsx.
const STARS_G = `<g fill="${RED}" stroke="#7a1a10" stroke-width="0.8" stroke-linejoin="round">${STARS.map(([x, y]) => `<polygon points="${star(x, y, 11.5)}"/>`).join('')}</g>`;
const logo = (w) => `<svg class="logo" width="${w}" viewBox="0 0 343 106" role="img" aria-label="Performance Capability">
  <rect x="9.5" y="8.5" width="87" height="88" fill="#140606" stroke="${RED}" stroke-width="2.2"/>${STARS_G}
  <rect x="115.5" y="12.5" width="218" height="29" fill="none" stroke="${RED}" stroke-width="1.2"/>
  <text x="224.5" y="36.5" text-anchor="middle" textLength="206" lengthAdjust="spacingAndGlyphs" fill="#f4f4f7" font-family="Sora, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="25">PERFORMANCE</text>
  <text x="221" y="83" text-anchor="middle" textLength="220" lengthAdjust="spacingAndGlyphs" fill="${RED}" font-family="'Libre Caslon Text', Georgia, serif" font-weight="700" font-size="36">CAPABILITY</text></svg>`;
const mark = (s) => `<svg class="mark" width="${s}" height="${s}" viewBox="7 6 92 93" aria-hidden="true"><rect x="9.5" y="8.5" width="87" height="88" fill="#140606" stroke="${RED}" stroke-width="3"/>${STARS_G}</svg>`;

// Player sprite paths from src/ui/sprites.tsx (PlayerSprite front/back); palettes from src/ui/looks.ts.
const FRONT = (p) => `<path d="M2 34h12v2h-12z" fill="#030204" opacity="0.6"/><path d="M3 11h10v11h-10z M1 12h2v9h-2z M13 12h2v9h-2z" fill="${p.suit}"/><path d="M1 12h1v9h-1z M3 11h2v1h-2z M11 11h2v1h-2z" fill="${p.suitHi}"/><path d="M6 11h1v11h-1z M9 11h1v11h-1z" fill="${p.suitShade}"/><path d="M7 10h2v1h-2z M7 11h2v1h-2z" fill="#d9dbe2"/><path d="M7 12h2v5h-2z" fill="${p.accent}"/><path d="M4 3h8v6h-8z M7 9h2v1h-2z M1 21h2v2h-2z M13 21h2v2h-2z" fill="${p.skin}"/><path d="M6 5h1v1h-1z M9 5h1v1h-1z" fill="#0a090d"/><path d="M7 7h2v1h-2z" fill="${p.hairShade}" opacity="0.6"/><path d="M4 0h8v3h-8z M3 1h1v5h-1z M12 1h1v5h-1z" fill="${p.hair}"/><path d="M4 3h2v1h-2z M10 3h2v1h-2z" fill="${p.hairShade}"/><path d="M3 22h10v1h-10z" fill="${p.suitShade}"/><path d="M3 23h10v2h-10z M3 25h4v7h-4z M9 25h4v7h-4z" fill="${p.suit}"/><path d="M7 23h2v2h-2z" fill="${p.suitShade}"/><path d="M2 32h5v2h-5z M9 32h5v2h-5z" fill="#050407"/>`;
const BACK = (p) => `<path d="M2 34h12v2h-12z" fill="#030204" opacity="0.6"/><path d="M3 11h10v11h-10z M1 12h2v9h-2z M13 12h2v9h-2z" fill="${p.suit}"/><path d="M1 12h1v9h-1z M4 11h2v1h-2z M10 11h2v1h-2z" fill="${p.suitHi}"/><path d="M3 13h1v8h-1z M12 13h1v8h-1z M14 12h1v9h-1z M8 14h1v8h-1z" fill="${p.suitShade}"/><path d="M6 10h4v1h-4z" fill="#d9dbe2"/><path d="M1 21h2v2h-2z M13 21h2v2h-2z M3 4h1v3h-1z M12 4h1v3h-1z M6 9h4v1h-4z" fill="${p.skin}"/><path d="M4 0h8v9h-8z M3 1h1v3h-1z M12 1h1v3h-1z" fill="${p.hair}"/><path d="M4 8h8v1h-8z M5 1h2v1h-2z" fill="${p.hairShade}"/><path d="M3 22h10v1h-10z" fill="${p.suitShade}"/><path d="M3 23h10v2h-10z M3 25h4v7h-4z M9 25h4v6h-4z" fill="${p.suit}"/><path d="M6 25h1v7h-1z M7 23h2v2h-2z" fill="${p.suitShade}"/><path d="M2 32h5v2h-5z M9 31h5v2h-5z" fill="#050407"/><path d="M14 22h5v6h-5z" fill="${p.suitHi}"/><path d="M14 22h5v1h-5z M16 21h1v1h-1z" fill="#8f6a1e"/><path d="M16 24h1v1h-1z" fill="#e0b34a"/>`;
const palette = (look) => (PLAYER_LOOKS[look] ?? PLAYER_LOOKS.ember).palette;
const sprite = (look, w, facing = 'down', cls = '') =>
  `<svg class="px ${cls}" width="${w}" height="${(w * 36) / 19}" viewBox="0 0 19 36" shape-rendering="crispEdges" aria-hidden="true">${(facing === 'up' ? BACK : FRONT)(palette(look))}</svg>`;

const roomSvg = (vb, cls = '', par = 'xMidYMid slice') =>
  `<svg class="px ${cls}" viewBox="${vb}" preserveAspectRatio="${par}" shape-rendering="crispEdges" aria-hidden="true">${ROOM.markup}</svg>`;
function portrait(id, size) {
  if (id === 'player') return `<span class="portrait you" style="width:${size}px;height:${size}px">${sprite(S.save.player?.look ?? 'ember', size * 0.8)}</span>`;
  const c = characterById(id);
  if (!c) return '';
  const { x, y } = c.sprite;
  return `<span class="portrait" style="width:${size}px;height:${size}px">${roomSvg(`${x - 10} ${y - 7} 20 20`)}</span>`;
}
// Medal art from src/ui/medals.tsx.
const MEDAL_COLORS = { bronze: ['#b8743c', '#7a4520', '#e3a36b'], silver: ['#c9ccd6', '#7d8190', '#f4f4f7'], gold: ['#e0b34a', '#8f6a1e', '#f3d98a'] };
function medalSvg(medal, s) {
  const [base, shade, hi] = medal ? MEDAL_COLORS[medal] : ['#2a2434', '#18141f', '#3e3650'];
  return `<svg class="px" width="${s}" height="${(s * 16) / 14}" viewBox="0 0 14 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M3 0h3v5H3z M8 0h3v5H8z" fill="${medal ? '#a3122f' : '#1e1a27'}"/><path d="M4 4h6v1H4z M3 5h8v1H3z M2 6h10v6H2z M3 12h8v1H3z M4 13h6v1H4z" fill="${base}"/><path d="M2 11h10v1H2z M3 12h8v1H3z M4 13h6v1H4z M11 6h1v5h-1z" fill="${shade}"/><path d="M4 6h2v1H4z M3 7h1v2H3z" fill="${hi}"/>${medal ? `<path d="M6 7h2v1H6z M5 8h4v1H5z M6 9h2v2H6z" fill="${shade}"/>` : ''}</svg>`;
}

const ICONS = {
  walk: '<path d="M12 4a2 2 0 1 0 0-.01M9 21l2-6 3 3v3M8 12l3-4 3 2 2 3M11 8l-1 5"/>',
  talk: '<path d="M4 5h16v10H9l-5 4z"/>',
  find: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  decide: '<path d="M12 3v18M5 8l7-5 7 5M5 8l-2 6h4zM19 8l-2 6h4z"/>',
  live: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',
  book: '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
  spark: '<path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4 6.4 20.5l2.1-6.7L3 9.8h6.8z"/>',
  scroll: '<path d="M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1h11v1a3 3 0 0 0 3 3M7 4a3 3 0 0 0-3 3v9"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  doc: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  elevator: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M8 9l-1.5 2h3zM16 13l1.5-2h-3z"/>',
  alert: '<path d="M12 4l9 16H3zM12 10v4M12 17v.5"/>',
  tilde: '<path d="M5 13c2-3 4-3 7 0s5 3 7 0"/>',
};
const ic = (n, s = 16) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

// Night skyline: decoration only, deterministic so screenshots are stable.
function skyline(w, h, seed, tower) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let out = '';
  for (let L = 0; L < 3; L++) {
    const depth = L / 2;
    const fill = ['#0e0b14', '#0b0910', '#07060a'][L];
    let x = -10;
    while (x < w) {
      const bw = 18 + r() * 46 * (1 + depth * 0.4);
      const bh = h * (0.25 + r() * 0.45) * (1 - depth * 0.35);
      const y = h - bh;
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}"/>`;
      if (r() > 0.55) out += `<rect x="${(x + bw / 2 - 0.6).toFixed(1)}" y="${(y - 18).toFixed(1)}" width="1.2" height="20" fill="${fill}"/><circle cx="${(x + bw / 2).toFixed(1)}" cy="${(y - 18).toFixed(1)}" r="1.4" fill="#ff1f4b"/>`;
      if (r() > 0.6) out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="1.4" fill="#ff1f4b" opacity="${(0.25 + depth * 0.5).toFixed(2)}"/>`;
      for (let wy = y + 6; wy < h - 4; wy += 7) for (let wx = x + 4; wx < x + bw - 4; wx += 6) {
        const v = r();
        if (v > 0.86) out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2.4" height="3" fill="${v > 0.97 ? '#ffd9c2' : '#ff2a45'}" opacity="${((0.25 + r() * 0.55) * (L === 0 ? 0.55 : 1)).toFixed(2)}"/>`;
      }
      x += bw + 2 + r() * 8;
    }
  }
  if (tower) {
    const { x, w: tw, top } = tower;
    out += `<path d="M${x} ${h} V${top + 30} L${x + tw / 2} ${top} L${x + tw} ${top + 30} V${h}Z" fill="#0a080d"/>`;
    out += `<path d="M${x + 3} ${h} V${top + 32} M${x + tw - 3} ${h} V${top + 32}" stroke="#ff1f4b" stroke-width="1.6" opacity=".9" filter="url(#glow${seed})"/>`;
    for (let wy = top + 52; wy < h - 6; wy += 9) for (let wx = x + 9; wx < x + tw - 9; wx += 8) { const v = r(); if (v > 0.6) out += `<rect x="${wx}" y="${wy}" width="3.5" height="4" fill="#ff2a45" opacity="${(0.15 + v * 0.45).toFixed(2)}"/>`; }
    out += `<g transform="translate(${x + tw / 2 - 18} ${top + 34}) scale(.38)" filter="url(#glow${seed})"><rect x="9.5" y="8.5" width="87" height="88" fill="#140606" stroke="${RED}" stroke-width="3"/>${STARS_G}</g>`;
  }
  return `<svg class="sky" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><filter id="glow${seed}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${out}</svg>`;
}

// ---------------------------------------------------------------- content helpers

const nameOf = (id) => (id === 'player' ? 'You' : id === 'narrator' ? '' : characterById(id)?.name ?? id);
const firstName = (id) => nameOf(id).split(' ')[0];
const sources = () => visibleHotspots(EXPLORE, run(), CTX).filter((h) => !h.secret);
const found = () => sources().filter((h) => run().inspected.includes(h.id));
const evidenceXp = () => Math.min(XP_RULES.evidenceCap, run().inspected.length * XP_RULES.perEvidence);
const unlocks = (hid) => decisionStages(SCENARIO).some((d) => d.options.some((o) => o.unlockedBy?.includes(hid)));
const meterLabel = (id) => SCENARIO.meters.find((m) => m.id === id)?.label ?? id;
const firstSentence = (t) => (t.match(/^.*?[.!?](?=\s|$)/) ?? [t])[0];
const verb = (h) => (h.secret ? 'Look closer' : h.kind === 'character' ? `Talk to ${h.label}` : `Examine the ${h.label.toLowerCase()}`);

function toast(title, text) {
  S.toast = { title, text, at: Date.now() };
  const el = document.getElementById('toast');
  if (el) {
    el.innerHTML = `${ic('book', 14)}<div><b>${esc(title)}</b><small>${esc(text)}</small></div>`;
    el.className = 'toast show';
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { el.className = 'toast'; }, 4200);
  }
}

// ---------------------------------------------------------------- screens

const screens = {};

screens.title = () => {
  const p = S.save.player;
  const best = S.save.best;
  return `
<div class="scr title">
  <div class="layer" style="background:radial-gradient(120% 90% at 78% 30%, #3a0812 0%, #12060a 45%, #050407 80%)"></div>
  <div class="layer par" data-depth="6" style="top:40px">${skyline(614, 312, 7, { x: 436, w: 92, top: 18 })}</div>
  <div class="layer rain"></div>
  <div class="layer shade-l"></div>
  <div class="layer" style="background:linear-gradient(0deg, rgba(255,31,75,.28) 0%, rgba(255,31,75,0) 32%)"></div>
  <div class="hero par" data-depth="16">${sprite(p?.look ?? 'ember', 87, 'up')}</div>
  <div class="ver">v0.2 · Playable prototype</div>
  <div class="title-body">
    ${logo(318)}
    <div class="eyebrow-line"><span>THE JOURNEY</span><i></i><span>HALCYON TOWER</span></div>
    <p class="tagline">Four floors. Four problems nobody has solved.<br><b>One new performance lead.</b></p>
    <div class="row gap10">
      <button class="btn" data-act="start" id="start">${p ? 'New journey' : 'Start Journey'} ${ic('arrow', 15)}</button>
      ${p ? `<button class="btn ghost" data-act="continue" id="continue">Continue</button>` : ''}
    </div>
    ${best.completions ? `<p class="bestline">${medalSvg(best.medal, 12)} Best on this floor: ${best.medal ? best.medal[0].toUpperCase() + best.medal.slice(1) : 'no medal'} · ${best.xp} XP</p>` : ''}
  </div>
  <div class="loopbar" aria-label="How you play">
    <span>${ic('walk', 15)}Walk</span><i></i><span>${ic('talk', 15)}Talk</span><i></i><span>${ic('find', 15)}Find</span><i></i><span>${ic('decide', 15)}Decide</span><i></i><span>${ic('live', 15)}Live with it</span>
  </div>
</div>`;
};

screens.select = () => {
  const sel = S.select;
  const card = (k) => `
    <button class="look ${sel.look === k ? 'sel' : ''}" role="radio" aria-checked="${sel.look === k}" data-act="look" data-look="${k}" tabindex="${sel.look === k ? 0 : -1}">
      ${sel.look === k ? '<span class="selchip">SELECTED</span>' : ''}
      <span class="plinth">${sprite(k, S.mobile ? 50 : 65)}</span>
      <span class="lname">${esc(PLAYER_LOOKS[k].label)}</span>
      <span class="sw">${['hair', 'suit', 'accent'].map((c) => `<i style="background:${PLAYER_LOOKS[k].palette[c]}"></i>`).join('')}</span>
    </button>`;
  return `
<div class="scr select">
  <div class="layer" style="background:radial-gradient(90% 70% at 50% 45%, #1a0810 0%, #08070b 70%)"></div>
  <div class="layer grid-floor"></div>
  <button class="chipbtn tl" data-act="go" data-to="title">${ic('back', 13)}Back</button>
  <div class="sel-head"><h2>Choose your look</h2><p>Your first week as performance lead at Halcyon Tower.</p></div>
  <div class="looks" role="radiogroup" aria-label="Look">${AVATARS.map(card).join('')}</div>
  <form class="passrow" data-form="pass" novalidate>
    <div class="pass">
      <div class="pass-photo">${sprite(sel.look, 26)}</div>
      <label class="pass-info">
        <span class="pass-k">HALCYON TOWER · STAFF PASS</span>
        <input id="name" name="name" autocomplete="nickname" maxlength="${MAX_NAME_LENGTH}" placeholder="Your name" value="${esc(sel.name)}" aria-invalid="${sel.err ? 'true' : 'false'}" aria-describedby="name-err">
        <span class="pass-meta"><span>Performance Lead</span><span>Access: Ground</span></span>
      </label>
    </div>
    <button class="btn sm" type="submit" id="issue">Issue my pass ${ic('arrow', 14)}</button>
  </form>
  <p class="formerr" id="name-err" role="alert">${esc(sel.err)}</p>
</div>`;
};

function hotspotButtons() {
  return visibleHotspots(EXPLORE, run(), CTX).map((h) => {
    const seen = run().inspected.includes(h.id);
    const person = h.kind === 'character';
    const w = person ? 22 : 26;
    const hh = person ? 40 : 26;
    return `<button class="hs ${person ? 'person' : 'thing'}${seen ? ' seen' : ''}${h.secret ? ' secret' : ''}" data-act="hotspot" data-id="${h.id}"
      style="left:${h.x - w / 2}px;top:${h.y - hh / 2}px;width:${w}px;height:${hh}px" aria-label="${esc(h.secret ? 'Something catches your eye' : verb(h) + (seen ? ' (again)' : ''))}">
      ${!seen && !h.secret ? `<span class="mk ${person ? 'e' : 'q'}" aria-hidden="true">${person ? '!' : '?'}</span>` : ''}
      ${h.secret ? '' : `<span class="tag" aria-hidden="true">${esc(h.label)}</span>`}
    </button>`;
  }).join('');
}

screens.lobby = () => {
  const r = run();
  const block = blocker(SCENARIO, { ...r, stageId: EXPLORE.id }, CTX);
  const intro = S.intro !== null;
  const lines = SCENARIO.stages[0].lines;
  const line = intro ? lines[S.intro] : null;
  return `
<div class="scr lobby ${intro ? 'has-intro' : ''}">
  <div class="roomview" id="roomview" tabindex="0" role="group" aria-label="Grand Lobby. Click or tap the floor to walk, or use the arrow keys or WASD. Press E to interact.">
    <div class="roomlayer" id="roomlayer">
      ${roomSvg('0 0 480 300', 'roomart', 'none')}
      <div class="floorhit" id="floorhit"></div>
      ${hotspotButtons()}
      <div class="player" id="player">${sprite(S.save.player.look, 19, 'up')}</div>
      <div class="prompt" id="prompt" hidden></div>
    </div>
    <div class="layer vignette"></div>
  </div>
  <div class="hud quest">${mark(26)}<div><b>${esc(SCENARIO.title)}</b><small>${esc(SCENARIO.hook)}</small>
    <span class="qnow"><span class="nowtag">NOW</span>${esc(EXPLORE.goal)}</span></div></div>
  <div class="hud floorchip">HALCYON TOWER · GROUND</div>
  <button class="hud me" data-act="notebook" id="nbbtn" aria-label="Open your notebook (N)">${portrait('player', 26)}<span><small>NOTEBOOK</small><b>${ic('book', 12)} ${found().length} / ${sources().length}</b></span></button>
  <span class="hud xpchip" title="XP from evidence so far">XP ${evidenceXp()}</span>
  <div class="hud keys"><span><kbd>WASD</kbd> Move</span><span><kbd>E</kbd> Interact</span><span><kbd>N</kbd> Notebook</span></div>
  <div class="dana">
    <button class="btn sm" data-act="to-transition" id="backdana" ${block ? 'disabled aria-disabled="true"' : ''}>Back to Dana ${ic('arrow', 13)}</button>
    ${block ? `<small>${esc(block)}</small>` : ''}
  </div>
  <div class="dpad" aria-hidden="true">
    <button data-key="ArrowUp" class="u">▲</button><button data-key="ArrowLeft" class="l">◀</button><button data-key="ArrowRight" class="r">▶</button><button data-key="ArrowDown" class="d">▼</button>
  </div>
  <button class="ebtn" id="ebtn" data-act="interact" hidden>E</button>
  ${intro ? `
  <div class="dlg intro" role="dialog" aria-label="${esc(SCENARIO.stages[0].title)}">
    ${line.speaker === 'narrator' ? '' : portrait(line.speaker, 62)}
    <div class="dlg-t">
      <div class="dlg-n">${line.speaker === 'narrator' ? esc(SCENARIO.stages[0].title) : esc(nameOf(line.speaker))}</div>
      <p class="${line.speaker === 'narrator' ? 'narr' : ''}">${esc(line.text)}</p>
      <div class="dlg-f"><button class="chipbtn sm" data-act="intro-next" id="next">Next ▸</button><button class="link" data-act="intro-skip">Skip all</button><span class="pg">${S.intro + 1} / ${lines.length}</span></div>
    </div>
  </div>` : ''}
</div>`;
};

screens.talk = () => {
  const t = S.talk;
  const c = characterById(t.h.characterId);
  const line = t.lines[t.i];
  const nextIsPlayer = t.lines[t.i + 1]?.speaker === 'player';
  const last = t.i >= t.lines.length - 1;
  const { x, y } = c.sprite;
  // Frame the character: a crop of the room art centred on them.
  const cw = S.mobile ? 70 : 84;
  const ch = S.mobile ? cw * (S.H / S.W) * 0.62 : cw * (S.H / S.W);
  const vx = Math.max(0, Math.min(480 - cw, x - cw / 2));
  const vy = Math.max(0, Math.min(300 - ch, y - ch * 0.45));
  return `
<div class="scr talk">
  <div class="talkbg">${roomSvg(`${vx} ${vy} ${cw} ${ch}`, 'bgroom')}</div>
  <div class="layer talkshade"></div>
  <div class="hud who">${portrait(c.id, 30)}<div><b>${esc(c.name)}</b><small>${esc(c.role)}</small></div></div>
  <button class="xbtn tr" data-act="leave" aria-label="Leave the conversation">${ic('x', 13)}</button>
  <div class="replies" role="group" aria-label="Your reply">
    ${nextIsPlayer ? `<button class="rp sel" data-act="say" id="reply">› ${esc(t.lines[t.i + 1].text)}</button>` : ''}
    <button class="rp" data-act="leave">› Leave for now.</button>
  </div>
  <div class="dlg" aria-live="polite">
    ${portrait(line.speaker, 62)}
    <div class="dlg-t">
      <div class="dlg-n">${esc(nameOf(line.speaker))}</div>
      <p>${esc(line.text)}</p>
      <div class="dlg-f">
        ${nextIsPlayer ? '<span class="hint">Choose a reply</span>' : `<button class="chipbtn sm" data-act="talk-next" id="next">${last ? 'Done ▸' : 'Next ▸'}</button>`}
        <span class="pg">${t.i + 1} / ${t.lines.length}</span>
      </div>
    </div>
  </div>
</div>`;
};

function docCard(h) {
  if (!h) return `<div class="doc card empty"><p>Pick a clue to read it.</p></div>`;
  const seen = run().inspected.includes(h.id);
  if (!seen) return `<div class="doc card empty"><div class="doc-src">${ic(h.kind === 'character' ? 'person' : h.icon ?? 'doc', 13)} ${esc(h.label.toUpperCase())}</div><p>You haven't ${h.kind === 'character' ? 'spoken to them' : 'looked at this'} yet. Find it in the lobby.</p></div>`;
  const fresh = S.nb.fresh === h.id && unlocks(h.id);
  if (h.doc) {
    return `<div class="doc card">
      <div class="doc-src">${ic(h.icon ?? 'doc', 13)} ${esc(h.doc.source.toUpperCase())}</div>
      <h3>${esc(h.doc.title)}</h3>
      <ul class="record">${h.doc.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <p class="sum">${esc(h.summary)}</p>
      ${fresh ? `<div class="unlock">${ic('unlock', 14)}<div><b>New reply unlocked</b><small>You have something new to tell Dana.</small></div></div>` : ''}
    </div>`;
  }
  const c = characterById(h.characterId);
  return `<div class="doc card">
    <div class="doc-src">${ic('person', 13)} ${esc(h.label.toUpperCase())}</div>
    <div class="person-row">${portrait(c.id, 46)}<div><h3>${esc(c.name)}</h3><small>${esc(c.role)}</small></div></div>
    <p class="sum">${esc(h.summary)}</p>
    ${fresh ? `<div class="unlock">${ic('unlock', 14)}<div><b>New reply unlocked</b><small>You have something new to tell Dana.</small></div></div>` : ''}
  </div>`;
}

screens.notebook = () => {
  const all = sources();
  const people = all.filter((h) => h.kind === 'character');
  const things = all.filter((h) => h.kind !== 'character');
  const secret = EXPLORE.hotspots.find((h) => h.secret && run().inspected.includes(h.id));
  const sel = EXPLORE.hotspots.find((h) => h.id === S.nb.sel) ?? null;
  const row = (h) => {
    const done = run().inspected.includes(h.id);
    const label = h.kind === 'character' ? `${h.label} · ${characterById(h.characterId).role.split(',')[0]}` : h.label;
    return `<button class="clue ${done ? 'done' : ''} ${S.nb.sel === h.id ? 'cur' : ''}" data-act="clue" data-id="${h.id}">
      <span class="ck">${done ? ic('check', 11) : ''}</span>${ic(h.kind === 'character' ? 'person' : h.icon ?? 'doc', 13)}<span class="cl">${esc(label)}</span>${S.nb.fresh === h.id ? '<span class="newtag">NEW</span>' : ''}</button>`;
  };
  const n = found().length;
  return `
<div class="scr notebook">
  <div class="layer" style="background:radial-gradient(80% 90% at 85% 20%, #1c0710 0%, #07060a 65%)"></div>
  <div class="nb card">
    <div class="nb-h"><span class="sq">${ic('book', 15)}</span><b>Notebook</b><span class="count">${n} / ${all.length}</span></div>
    <div class="bar"><i style="width:${(n / all.length) * 100}%"></i></div>
    <div class="grp">PEOPLE</div>${people.map(row).join('')}
    <div class="grp">EVIDENCE</div>${things.map(row).join('')}
    ${secret ? `<button class="clue done memo ${S.nb.sel === secret.id ? 'cur' : ''}" data-act="clue" data-id="${secret.id}"><span class="ck">${ic('check', 11)}</span>${ic('scroll', 13)}<span class="cl">${esc(secret.doc.title)}</span></button>` : ''}
  </div>
  ${docCard(sel)}
  <button class="xbtn tr" data-act="go" data-to="lobby" aria-label="Close the notebook (Esc)">${ic('x', 13)}</button>
</div>`;
};

screens.transition = () => {
  const r = run();
  const all = sources();
  const n = found().length;
  const req = EXPLORE.required.map((id) => EXPLORE.hotspots.find((h) => h.id === id));
  const ob = (done, text) => `<div class="ob ${done ? 'done' : ''}"><span class="ck">${done ? ic('check', 11) : ''}</span>${esc(text)}</div>`;
  const dana = EXPLORE.hotspots.find((h) => h.id === 'dana');
  return `
<div class="scr transition">
  <div class="layer" style="background:#07060a"></div>
  <div class="flat">
    ${roomSvg('0 0 480 300', 'flatroom', 'xMidYMid meet')}
    <div class="wipe"></div><div class="scan"></div>
    <div class="ping" style="left:${(dana.x / 480) * 100}%;top:${(dana.y / 300) * 100 - 4}%"><span>!</span></div>
    <div class="you" style="left:${(S.save.pos.x / 480) * 100}%;top:${(S.save.pos.y / 300) * 100}%">${sprite(S.save.player.look, 8, 'up')}</div>
  </div>
  <div class="hud brief">${mark(24)}<div><b>Back to Dana</b><small>${esc(characterById('dana').name)} is waiting at reception for your read.</small></div></div>
  <button class="chipbtn tr" data-act="go" data-to="lobby">${ic('back', 12)} Keep looking</button>
  <div class="mode">${ic('screen', 12)} SWITCHING TO DECISION VIEW</div>
  <div class="obj card">
    <div class="obj-h">Your objective</div>
    ${ob(n === all.length, `${n} of ${all.length} sources examined`)}
    ${req.map((h) => ob(r.inspected.includes(h.id), `Talked to ${h.label}`)).join('')}
    ${decisionStages(SCENARIO).map((d) => ob(Boolean(r.choices[d.id]), d.title)).join('')}
    <div class="medalline">${medalSvg('gold', 13)}<span><b>Gold:</b> ${esc(MEDAL_RULES.gold.criterion)}</span></div>
  </div>
  <button class="btn big enter" data-act="enter-decision" id="enter">Enter decision ${ic('arrow', 16)}</button>
</div>`;
};

screens.decision = () => {
  const r = run();
  const stage = currentStage(SCENARIO, r);
  const decisions = decisionStages(SCENARIO);
  const idx = decisions.findIndex((d) => d.id === stage.id);
  const open = stage.options.filter((o) => optionAvailable(o, r));
  const locked = stage.options.length - open.length;
  const asker = characterById(stage.asker);
  const ev = availableEvidence(SCENARIO, stage, r, CTX);
  const seen = ev.filter((h) => r.inspected.includes(h.id)).length;
  const { x, y } = asker.sprite;
  return `
<div class="scr decision">
  <div class="layer" style="background:#08070b"></div>
  <div class="topbar">${mark(26)}<div><b>${esc(stage.title)}</b><small>${esc(ZONE.place)} · ${esc(SCENARIO.title)}</small></div>
    <div class="tb-r"><div class="minibar"><i style="width:${((idx + 1) / decisions.length) * 100}%"></i></div><span class="pg">${idx + 1} / ${decisions.length}</span><span class="xp">XP ${evidenceXp()}</span></div></div>
  <form class="q card" data-form="decide" novalidate>
    <p class="qp"><span class="asker">${esc(asker.name)}</span>${esc(stage.prompt)}</p>
    <div role="radiogroup" aria-label="Your answer">
    ${open.map((o, i) => {
      const via = (o.unlockedBy ?? []).filter((id) => r.inspected.includes(id)).map((id) => EXPLORE.hotspots.find((h) => h.id === id)?.label).filter(Boolean);
      return `<button type="button" class="opt ${S.dec.sel === i ? 'sel' : ''}" role="radio" aria-checked="${S.dec.sel === i}" data-act="pick" data-i="${i}">
        <span class="ol">${'ABCD'[i]}</span><span class="ot">${esc(o.label)}${via.length ? `<span class="utag">${ic('unlock', 10)} ${esc(via.join(' · '))}</span>` : ''}</span></button>`;
    }).join('')}
    </div>
    ${locked ? `<p class="locked">${ic('lock', 12)} ${locked === 1 ? 'There may be another answer' : `There may be ${locked} other answers`}, if you knew more.</p>` : ''}
    <div class="q-f"><span class="muted">${ic('book', 12)} ${seen} / ${ev.length} sources</span><span class="formerr" role="alert">${esc(S.dec.err)}</span><button class="btn sm" type="submit" id="sayit">Say it ${ic('arrow', 13)}</button></div>
  </form>
  <div class="scene">
    ${roomSvg(`${x - 44} ${y - 46} 88 150`)}
    <div class="bubble">“${esc(asker.perspective)}”</div>
    <div class="namechip">${esc(firstName(asker.id))} · ${esc(asker.role)}</div>
  </div>
</div>`;
};

const QUALITY = { strong: ['check', 'STRONG'], mixed: ['tilde', 'MIXED'], weak: ['alert', 'WEAK'] };

screens.feedback = () => {
  const r = run();
  const stage = currentStage(SCENARIO, r);
  const o = chosenOption(SCENARIO, r, stage.id);
  const [icon, label] = QUALITY[o.quality];
  const learn = o.principleIds.map(resolveReference).filter(Boolean).slice(0, 3);
  const effects = Object.entries(o.outcome.effects).filter(([, v]) => v);
  const reactions = linesFor(o.outcome.reactions.map((x) => ({ ...x, speaker: x.characterId })), r, CTX);
  return `
<div class="scr feedback q-${o.quality}">
  <div class="layer" style="background:radial-gradient(70% 90% at 100% 0%, #2a0611 0%, #07060a 60%)"></div>
  <div class="layer fbsky">${skyline(614, 120, 41)}</div>
  <div class="fb card">
    <div class="fb-h"><span class="okc">${ic(icon, 20)}</span><div><span class="qual">${label}</span><h3>${esc(o.outcome.headline)}</h3></div></div>
    <p>${esc(o.feedback)}</p>
    <div class="kl">Key learning</div>
    <ul>${learn.map((p) => `<li><b>${esc(p.title.replace(/\.$/, ''))}.</b> ${esc(firstSentence(p.summary))}</li>`).join('')}</ul>
    <div class="fb-f">
      ${o.quality === 'strong' ? `<span class="rw">${ic('spark', 14)}+1 Insight fragment</span>` : ''}
      ${effects.map(([k, v]) => `<span class="rw ${v > 0 ? 'up' : 'down'}">${esc(meterLabel(k))} ${v > 0 ? '+' : ''}${v}</span>`).join('')}
      <button class="btn sm" data-act="after-feedback" id="continue">Continue ${ic('arrow', 13)}</button>
    </div>
  </div>
  <div class="reacts">
    <p class="narr">${esc(o.outcome.narrative.join(' '))}</p>
    ${reactions.map((x) => `<div class="react">${portrait(x.characterId, 40)}<div><b>${esc(firstName(x.characterId))} <em class="m-${x.mood}">${esc(x.mood)}</em></b><p>“${esc(x.text)}”</p></div></div>`).join('')}
  </div>
</div>`;
};

screens.reflection = () => {
  const stage = currentStage(SCENARIO, run());
  return `
<div class="scr reflection">
  <div class="layer" style="background:radial-gradient(80% 90% at 15% 10%, #1c0710 0%, #07060a 65%)"></div>
  <form class="refl card" data-form="reflect" novalidate>
    <div class="nb-h"><span class="sq">${ic('book', 15)}</span><b>${esc(stage.title)}</b><span class="count">+${XP_RULES.reflection} XP</span></div>
    <p class="qp">${esc(stage.prompt)}</p>
    <div class="checks">${stage.options.map((o) => `<label class="chk"><input type="checkbox" name="r" value="${o.id}" ${S.refl.sel.has(o.id) ? 'checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}</div>
    <label class="note"><span>${esc(stage.notePrompt ?? '')}</span><textarea name="note" rows="2" maxlength="2000" placeholder="Optional. Never scored.">${esc(S.refl.note)}</textarea></label>
    <div class="q-f"><span class="formerr" role="alert">${esc(S.refl.err)}</span><button class="btn sm" type="submit" id="finish">Finish the floor ${ic('arrow', 13)}</button></div>
  </form>
</div>`;
};

screens.complete = () => {
  const r = run();
  const result = score(SCENARIO, r);
  const medal = medalFor(SCENARIO, result);
  const checks = medalChecks(SCENARIO, result);
  const strong = decisionStages(SCENARIO).filter((d) => chosenOption(SCENARIO, r, d.id)?.quality === 'strong').length;
  const memo = EXPLORE.hotspots.some((h) => h.secret && r.inspected.includes(h.id));
  const next = ZONES.find((z) => z.requires.length === 1 && z.requires[0] === ZONE.id);
  const floors = [...ZONES].reverse().map((z) => {
    const state = z.id === ZONE.id ? 'done' : z === next ? 'open' : 'locked';
    return `<div class="fl ${state}"><span class="fn">${z.floor === 'Ground' ? 'G' : esc(z.floor)}</span><div><b>${esc(z.place)}</b><small>${esc(z.name)}${state === 'done' ? ' · Resolved' : ''}</small></div>${state === 'done' ? medalSvg(medal, 15) : state === 'open' ? '<span class="opentag">OPEN</span>' : ic('lock', 14)}</div>`;
  }).join('');
  const nice = medal ? `${medal[0].toUpperCase()}${medal.slice(1)} · ${MEDAL_RULES[medal].title.split(': ')[1]}` : 'No medal';
  return `
<div class="scr complete">
  <div class="layer" style="background:radial-gradient(70% 80% at 30% 30%, #240710 0%, #07060a 65%)"></div>
  <div class="layer rays"></div>
  <div class="rep">
    <div class="eyebrow">FLOOR ${esc(ZONE.floor.toUpperCase())} · REPORT</div>
    <h2>${esc(ZONE.place)}: resolved</h2>
    <div class="medalrow"><div class="medalglow">${medalSvg(medal, 50)}</div><div><b class="goldt m-${medal ?? 'none'}">${esc(nice)}</b><small>${checks.map((c) => `${c.met ? '✓' : '·'} ${c.title.split(':')[0]}`).join('  ')} · Reasoning ${result.overall}%</small></div></div>
    <div class="rewards">
      <div class="rwd"><b>+${result.xp}</b><small>XP</small></div>
      <div class="rwd">${ic('key', 18)}<small>${esc(ZONE.artefact.name)}</small></div>
      <div class="rwd">${ic('spark', 18)}<small>${strong} Insight${strong === 1 ? '' : 's'}</small></div>
      <div class="rwd">${ic('scroll', 18)}<small>Memo ${memo ? 1 : 0} / 4</small></div>
    </div>
    <div class="meters">${SCENARIO.meters.map((m) => `<div class="mt"><span>${esc(m.label)}</span><div class="mt-b"><i style="width:${result.meters[m.id] * 10}%"></i></div><b>${result.meters[m.id]}/10</b></div>`).join('')}</div>
  </div>
  <div class="tower card">
    <div class="obj-h">${ic('elevator', 14)} The Tower</div>
    ${floors}
    <a class="btn sm full" href="../#/zone/${next.id}" id="elevator">Take the elevator to ${esc(next.floor)} ${ic('arrow', 13)}</a>
    <div class="tw-links"><button class="link" data-act="replay" id="replay">Play it differently</button><button class="link" data-act="go" data-to="title">Back to title</button></div>
  </div>
</div>`;
};

// ---------------------------------------------------------------- actions

function go(screen) {
  if (S.screen === 'lobby') stopLobby();
  S.screen = screen;
  render();
}

function openHotspot(h) {
  stopKeys();
  setRun(inspect(run(), h.id));
  persistPos();
  if (h.kind === 'character' && h.lines) {
    S.talk = { h, lines: linesFor(h.lines, run(), CTX), i: 0 };
    go('talk');
  } else {
    S.nb = { sel: h.id, fresh: h.id };
    go('notebook');
  }
}

function endTalk() {
  const h = S.talk.h;
  S.talk = null;
  S.nb = { sel: h.id, fresh: unlocks(h.id) ? h.id : null };
  go('lobby');
  toast('Clue added', h.summary);
}

const actions = {
  go: (el) => go(el.dataset.to),
  start: () => {
    S.select = { look: S.save.player?.look ?? 'ember', name: S.save.player?.name ?? '', err: '' };
    go('select');
  },
  continue: () => {
    const screen = resumeScreen(SCENARIO, S.save);
    if (screen === 'lobby' && run().stageId === SCENARIO.stages[0].id) S.intro = 0;
    go(screen);
  },
  look: (el) => { S.select.look = el.dataset.look; S.select.name = document.getElementById('name')?.value ?? S.select.name; render(); document.querySelector('.look.sel')?.focus(); },
  'intro-next': () => {
    S.intro += 1;
    if (S.intro >= SCENARIO.stages[0].lines.length) { S.intro = null; setRun(advance(SCENARIO, run(), CTX)); }
    render();
  },
  'intro-skip': () => { S.intro = null; setRun(advance(SCENARIO, run(), CTX)); render(); },
  hotspot: (el) => {
    const h = EXPLORE.hotspots.find((x) => x.id === el.dataset.id);
    if (h) walkTo(h.x, h.y, h);
  },
  interact: () => { if (L.near) openHotspot(L.near); },
  notebook: () => { S.nb = { sel: S.nb.sel ?? found()[0]?.id ?? null, fresh: null }; go('notebook'); },
  clue: (el) => { S.nb.sel = el.dataset.id; render(); },
  'talk-next': () => {
    if (S.talk.i >= S.talk.lines.length - 1) return endTalk();
    S.talk.i += 1;
    render();
  },
  say: () => { S.talk.i += 1; render(); },
  leave: () => endTalk(),
  'to-transition': () => { if (!missingRequired(EXPLORE, run(), CTX).length) go('transition'); },
  'enter-decision': () => {
    const r = run();
    if (r.stageId === EXPLORE.id) setRun(advance(SCENARIO, r, CTX));
    S.dec = { sel: -1, err: '' };
    go(resumeScreen(SCENARIO, S.save));
  },
  pick: (el) => { S.dec.sel = Number(el.dataset.i); S.dec.err = ''; render(); document.querySelector('.opt.sel')?.focus(); },
  'after-feedback': () => {
    setRun(advance(SCENARIO, run(), CTX));
    S.dec = { sel: -1, err: '' };
    go(resumeScreen(SCENARIO, S.save));
  },
  replay: () => {
    S.save = { ...S.save, run: startRun(SCENARIO), pos: { ...SCENARIO.start } };
    persist(store, S.save);
    S.intro = 0;
    S.refl = { sel: new Set(), note: '', err: '' };
    go('lobby');
  },
};

const forms = {
  pass: (form) => {
    const name = cleanName(form.name.value);
    S.select.name = form.name.value;
    if (!name) { S.select.err = 'Add your name to the pass first.'; render(); document.getElementById('name')?.focus(); return; }
    S.save = startFresh(S.save, SCENARIO, { name, look: S.select.look });
    persist(store, S.save);
    S.intro = 0;
    go('lobby');
  },
  decide: () => {
    const stage = currentStage(SCENARIO, run());
    const open = stage.options.filter((o) => optionAvailable(o, run()));
    const o = open[S.dec.sel];
    if (!o) { S.dec.err = 'Choose an answer first.'; render(); return; }
    setRun(choose(SCENARIO, run(), stage.id, o.id, CTX));
    go('feedback');
  },
  reflect: (form) => {
    const sel = [...form.querySelectorAll('input[name=r]:checked')].map((i) => i.value);
    S.refl = { sel: new Set(sel), note: form.note.value, err: '' };
    if (!sel.length) { S.refl.err = 'Tick at least one line to finish.'; render(); return; }
    let next = reflect(run(), sel, form.note.value);
    next = advance(SCENARIO, next, CTX);
    setRun(next);
    const result = score(SCENARIO, next);
    S.save = recordFinish(S.save, result.xp, medalFor(SCENARIO, result));
    persist(store, S.save);
    go('complete');
  },
};

// ---------------------------------------------------------------- lobby movement

const L = { pos: null, target: null, pending: null, keys: new Set(), raf: 0, last: 0, stuck: 0, facing: 'up', near: null, k: 1, vw: 0, vh: 0 };

function persistPos() { S.save = { ...S.save, pos: { x: Math.round(L.pos?.x ?? S.save.pos.x), y: Math.round(L.pos?.y ?? S.save.pos.y) } }; persist(store, S.save); }
function stopKeys() { L.keys.clear(); L.target = null; L.pending = null; }

function startLobby() {
  L.pos = walkable(ROOM, S.save.pos.x, S.save.pos.y) ? { ...S.save.pos } : { ...SCENARIO.start };
  const view = document.getElementById('roomview');
  L.vw = view.clientWidth;
  L.vh = view.clientHeight;
  L.k = Math.max(L.vw / 400, L.vh / 300);
  const floor = document.getElementById('floorhit');
  floor.addEventListener('pointerdown', (e) => {
    if (S.intro !== null || e.button !== 0) return;
    const p = toRoom(e.clientX, e.clientY);
    walkTo(p.x, p.y, null);
  });
  document.querySelectorAll('.dpad button').forEach((b) => {
    const on = (e) => { e.preventDefault(); L.keys.add(b.dataset.key); loop(); };
    const off = () => L.keys.delete(b.dataset.key);
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  });
  draw();
  loop();
}
function stopLobby() {
  cancelAnimationFrame(L.raf);
  L.raf = 0;
  stopKeys();
  if (L.pos) persistPos();
}

function toRoom(cx, cy) {
  const r = document.getElementById('roomlayer').getBoundingClientRect();
  return { x: ((cx - r.left) / r.width) * 480, y: ((cy - r.top) / r.height) * 300 };
}

function walkTo(x, y, h) {
  const t = h ? approachPoint(ROOM, h.x, h.y, L.pos) : clampTarget(ROOM, x, y);
  L.pending = h;
  if (reducedMotion || Math.hypot(t.x - L.pos.x, t.y - L.pos.y) < REACH / 2) {
    L.pos = t;
    arrive();
    draw();
    return;
  }
  L.target = t;
  loop();
}
function arrive() {
  L.target = null;
  const h = L.pending;
  L.pending = null;
  if (h) openHotspot(h);
}

function nearest() {
  if (S.intro !== null) return null;
  return visibleHotspots(EXPLORE, run(), CTX)
    .map((h) => {
      const a = approachPoint(ROOM, h.x, h.y, L.pos);
      return { h, d: Math.min(Math.hypot(a.x - L.pos.x, a.y - L.pos.y), Math.hypot(h.x - L.pos.x, h.y + 16 - L.pos.y)) };
    })
    .filter((n) => n.d < REACH)
    .sort((a, b) => a.d - b.d)[0]?.h ?? null;
}

function draw() {
  const layer = document.getElementById('roomlayer');
  if (!layer) return;
  const { k, vw, vh, pos } = L;
  const cx = Math.max(0, Math.min(480 - vw / k, pos.x - vw / k / 2));
  const cy = Math.max(0, Math.min(300 - vh / k, pos.y - 20 - vh / k / 2));
  layer.style.transform = `translate(${-cx * k}px, ${-cy * k}px) scale(${k})`;
  const p = document.getElementById('player');
  p.style.left = `${pos.x}px`;
  p.style.top = `${pos.y}px`;
  p.innerHTML = sprite(S.save.player.look, 19, L.facing);
  p.classList.toggle('walking', Boolean(L.target || L.keys.size));
  L.near = nearest();
  const prompt = document.getElementById('prompt');
  const e = document.getElementById('ebtn');
  document.querySelectorAll('.hs.near').forEach((x) => x.classList.remove('near'));
  if (L.near) {
    prompt.hidden = false;
    prompt.innerHTML = `<kbd>E</kbd> ${esc(verb(L.near))}`;
    prompt.style.left = `${pos.x}px`;
    prompt.style.top = `${pos.y - 44}px`;
    document.querySelector(`.hs[data-id="${L.near.id}"]`)?.classList.add('near');
    if (e) e.hidden = false;
  } else {
    prompt.hidden = true;
    if (e) e.hidden = true;
  }
}

function loop() {
  if (L.raf) return;
  L.last = 0;
  const tick = (t) => {
    const dt = Math.min(0.05, L.last ? (t - L.last) / 1000 : 0.016);
    L.last = t;
    let dx = 0;
    let dy = 0;
    const k = L.keys;
    if (k.size) {
      if (k.has('ArrowLeft') || k.has('a')) dx -= 1;
      if (k.has('ArrowRight') || k.has('d')) dx += 1;
      if (k.has('ArrowUp') || k.has('w')) dy -= 1;
      if (k.has('ArrowDown') || k.has('s')) dy += 1;
      if (dx || dy) { L.target = null; L.pending = null; }
    } else if (L.target) {
      dx = L.target.x - L.pos.x;
      dy = L.target.y - L.pos.y;
      if (Math.hypot(dx, dy) < 2) { arrive(); dx = 0; dy = 0; }
    }
    const len = Math.hypot(dx, dy);
    if (len > 0 && S.screen === 'lobby') {
      const step = Math.min(SPEED * dt, L.target && !k.size ? len : Infinity);
      const nx = L.pos.x + (dx / len) * step;
      const ny = L.pos.y + (dy / len) * step;
      const before = { ...L.pos };
      if (walkable(ROOM, nx, ny)) L.pos = { x: nx, y: ny };
      else if (walkable(ROOM, nx, L.pos.y)) L.pos = { x: nx, y: L.pos.y };
      else if (walkable(ROOM, L.pos.x, ny)) L.pos = { x: L.pos.x, y: ny };
      const moved = Math.hypot(L.pos.x - before.x, L.pos.y - before.y);
      if (moved < 0.01) {
        L.stuck += dt;
        if (L.stuck > 0.25 && L.target) { L.stuck = 0; arrive(); }
      } else L.stuck = 0;
      if (Math.abs(dy) > Math.abs(dx) * 0.6) L.facing = dy < 0 ? 'up' : 'down';
    }
    if (S.screen !== 'lobby') { L.raf = 0; return; }
    draw();
    if (k.size || L.target) L.raf = requestAnimationFrame(tick);
    else { L.raf = 0; persistPos(); }
  };
  L.raf = requestAnimationFrame(tick);
}

// ---------------------------------------------------------------- input

const MOVE = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'];
document.addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea')) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const scr = S.screen;
  if (scr === 'lobby') {
    if (S.intro !== null) {
      if (key === 'Enter' || key === ' ' || key === 'e') { e.preventDefault(); actions['intro-next'](); }
      else if (key === 'Escape') actions['intro-skip']();
      return;
    }
    if (MOVE.includes(key)) { e.preventDefault(); L.keys.add(key); loop(); }
    else if ((key === 'e' || key === 'Enter' || key === ' ') && L.near && !e.target.closest('button')) { e.preventDefault(); openHotspot(L.near); }
    else if (key === 'n') actions.notebook();
  } else if (scr === 'talk') {
    if (key === 'Escape') actions.leave();
    else if ((key === 'Enter' || key === ' ' || key === 'e') && !e.target.closest('button')) {
      e.preventDefault();
      (document.getElementById('next') ?? document.getElementById('reply'))?.click();
    }
  } else if (scr === 'notebook') {
    if (key === 'Escape' || key === 'n') go('lobby');
  } else if (scr === 'decision') {
    const n = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 }[key];
    const opts = document.querySelectorAll('.opt');
    if (n !== undefined && opts[n]) { e.preventDefault(); opts[n].click(); }
    else if ((key === 'ArrowDown' || key === 'ArrowUp') && opts.length) {
      e.preventDefault();
      const cur = Math.max(-1, S.dec.sel);
      opts[(cur + (key === 'ArrowDown' ? 1 : opts.length - 1)) % opts.length].click();
    }
  } else if (scr === 'select') {
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      const i = AVATARS.indexOf(S.select.look);
      const next = AVATARS[(i + (key === 'ArrowRight' ? 1 : AVATARS.length - 1)) % AVATARS.length];
      document.querySelector(`.look[data-look="${next}"]`)?.click();
    }
  } else if (scr === 'transition' && key === 'Escape') go('lobby');
});
// Move focus to the main button only for keyboard players, so mouse and touch
// players don't see a focus ring they didn't ask for.
let keyboardUser = false;
document.addEventListener('keydown', () => { keyboardUser = true; }, true);
document.addEventListener('pointerdown', () => { keyboardUser = false; }, true);
document.addEventListener('keyup', (e) => L.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
window.addEventListener('blur', () => L.keys.clear());

const stageEl = document.getElementById('stage');
stageEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !stageEl.contains(el) || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});
stageEl.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  forms[form.dataset.form]?.(form);
});
stageEl.addEventListener('input', (e) => {
  if (e.target.id === 'name') S.select.name = e.target.value;
});
// Simulated depth on the title screen: 2D layers shift at different rates.
stageEl.addEventListener('pointermove', (e) => {
  if (S.screen !== 'title' || reducedMotion) return;
  const r = stageEl.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width - 0.5;
  const fy = (e.clientY - r.top) / r.height - 0.5;
  stageEl.querySelectorAll('.par').forEach((el) => { el.style.translate = `${(-fx * el.dataset.depth).toFixed(1)}px ${(-fy * el.dataset.depth * 0.4).toFixed(1)}px`; });
});

// ---------------------------------------------------------------- layout + render

function fit() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 720 && vh > vw;
  const chrome = document.querySelector('.chrome');
  const foot = document.querySelector('.pagefoot');
  document.body.classList.toggle('mobile', mobile);
  let W = 614;
  let H = 352;
  let s;
  if (mobile) {
    W = 390;
    H = Math.max(640, Math.round((390 * vh) / vw));
    s = vw / W;
  } else {
    const top = chrome.offsetHeight + foot.offsetHeight + 28;
    s = Math.min((vw - 32) / W, (vh - top) / H);
    s = Math.max(0.5, s);
  }
  const changed = mobile !== S.mobile || W !== S.W || H !== S.H;
  Object.assign(S, { mobile, W, H });
  const frame = document.getElementById('frame');
  frame.style.width = `${W * s}px`;
  frame.style.height = `${H * s}px`;
  stageEl.style.width = `${W}px`;
  stageEl.style.height = `${H}px`;
  stageEl.style.setProperty('--H', `${H}px`);
  stageEl.style.transform = `scale(${s})`;
  stageEl.classList.toggle('mob', mobile);
  if (changed) render();
}

function render() {
  if (S.screen !== 'title' && S.screen !== 'select' && !S.save.player) S.screen = 'select';
  if (S.screen === 'talk' && !S.talk) S.screen = 'lobby';
  stageEl.innerHTML = screens[S.screen]() + '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  stageEl.dataset.screen = S.screen;
  document.title = `${{ title: 'Title', select: 'Choose your look', lobby: 'Grand Lobby', talk: 'Talk', notebook: 'Notebook', transition: 'Back to Dana', decision: 'Decision', feedback: 'Consequence', reflection: 'Notebook', complete: 'Floor complete' }[S.screen]} · Performance Capability: The Journey (prototype)`;
  if (S.screen === 'lobby') {
    startLobby();
    if (S.intro === null && run().stageId === SCENARIO.stages[0].id) { S.intro = 0; render(); return; }
    document.getElementById('roomview').focus({ preventScroll: true });
  }
  if (S.screen !== 'lobby') S.toast = null;
  else if (S.toast && Date.now() - S.toast.at < 3800) toast(S.toast.title, S.toast.text);
  const auto = stageEl.querySelector('#next, #reply, #name, #sayit, #continue, #enter, #start');
  if (auto && keyboardUser && S.screen !== 'lobby' && !stageEl.contains(document.activeElement)) auto.focus({ preventScroll: true });
}

document.getElementById('chmark').outerHTML = mark(30);
window.addEventListener('resize', fit);
fit();
render();
// Test hook: lets the end-to-end check read state without poking at the DOM.
window.__proto = { get screen() { return S.screen; }, get run() { return run(); }, get save() { return S.save; } };
