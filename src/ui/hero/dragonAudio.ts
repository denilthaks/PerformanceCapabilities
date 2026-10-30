// The dragon hero's sound: a low rumble loop plus whooshes, roars and an
// impact, cued to the scene clock so each roar lands on its dragon's jaw.
// All files were synthesised for this project (see docs/DRAGON-HERO.md).
// Nothing plays until the visitor turns sound on: browsers only allow audio
// after a click, and an unasked-for roar would be unwelcome.

import { ENTRANCE_S, IDLE_S } from './timing';

interface Cue { at: number; file: string; gain: number; loop?: boolean }

/** Scene seconds: the entrance starts at 0; Idle begins at 7 and repeats every 12. */
const ENTRANCE_CUES: Cue[] = [
  { at: 1.7, file: 'whoosh_black', gain: 0.8 },
  { at: 2.9, file: 'whoosh_white', gain: 0.6 },
  { at: 4.3, file: 'roar_black', gain: 1.0 },      // black dragon's jaw opens 4.3 s - 6.1 s
  { at: 5.4, file: 'call_white', gain: 0.7 },      // white dragon's jaw opens 5.4 s - 6.85 s
  { at: 6.1, file: 'impact_yinyang', gain: 0.8 },  // the yin-yang reaches prominence
];
const IDLE_CUES: Cue[] = [
  { at: 5.5, file: 'roar_black', gain: 0.9 },      // 5.5 s - 7.3 s into each idle loop
  { at: 9.0, file: 'call_white', gain: 0.65 },     // 9.0 s - 10.4 s into each idle loop
];
const FILES = ['rumble_loop', 'whoosh_black', 'whoosh_white', 'roar_black', 'call_white', 'impact_yinyang'];
const LOOKAHEAD = 0.3;
const VOLUME = 0.6;

export interface ScheduledCue { file: string; sceneAt: number; contextAt: number }

export class DragonAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private sources = new Set<AudioScheduledSourceNode>();
  private done = new Set<string>();
  private offset = 0;              // context time = scene time + offset
  private on = false;
  /** Every cue scheduled since sound was turned on (for tests). */
  readonly log: ScheduledCue[] = [];

  get enabled() { return this.on; }

  /** Turn sound on. Must be called from a click. `sceneTime` is read once loading is done. */
  async enable(sceneTime: () => number) {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    const ctx = this.ctx;
    await ctx.resume();
    const base = `${import.meta.env.BASE_URL}dragons/audio/`;
    await Promise.all(FILES.filter((f) => !this.buffers.has(f)).map(async (f) => {
      const data = await (await fetch(`${base}${f}.mp3`)).arrayBuffer();
      this.buffers.set(f, await ctx.decodeAudioData(data));
    }));
    this.on = true;
    const t = sceneTime();
    this.offset = ctx.currentTime - t;
    this.done.clear();
    const now = ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(0, now);
    this.master!.gain.linearRampToValueAtTime(VOLUME, now + 1.2);
    this.play('rumble_loop', now, 0.55, true);
    this.update(t);
  }

  /** Fade out and stop everything. */
  disable() {
    this.on = false;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.4);
    for (const s of this.sources) s.stop(now + 0.45);
    this.sources.clear();
  }

  /** Pause with the scene (the context clock stops too, so cues stay in sync). */
  setPaused(paused: boolean) {
    if (!this.ctx || !this.on) return;
    if (paused) void this.ctx.suspend(); else void this.ctx.resume();
  }

  /** Schedule the cues falling within the next second of scene time. */
  update(sceneTime: number) {
    if (!this.on || !this.ctx) return;
    // The scene clock can fall behind on slow frames; keep the mapping honest.
    const drift = this.ctx.currentTime - (sceneTime + this.offset);
    if (Math.abs(drift) > 0.05) this.offset += drift;
    const cues: (Cue & { key: string })[] = ENTRANCE_CUES.map((c) => ({ ...c, key: `e:${c.file}` }));
    const loop = Math.floor(Math.max(0, sceneTime - ENTRANCE_S) / IDLE_S);
    for (const k of [loop, loop + 1]) for (const c of IDLE_CUES) cues.push({ ...c, at: ENTRANCE_S + k * IDLE_S + c.at, key: `i${k}:${c.file}` });
    for (const c of cues) {
      if (this.done.has(c.key) || c.at < sceneTime - 0.05 || c.at > sceneTime + LOOKAHEAD) continue;
      this.done.add(c.key);
      const when = c.at + this.offset;
      this.play(c.file, when, c.gain, false);
      this.log.push({ file: c.file, sceneAt: c.at, contextAt: when });
    }
  }

  /** Clock mapping, for tests: context time for a scene time. */
  contextTimeFor(sceneTime: number) { return sceneTime + this.offset; }

  dispose() {
    this.disable();
    void this.ctx?.close();
    this.ctx = null;
  }

  private play(file: string, when: number, gain: number, loop: boolean) {
    const ctx = this.ctx!, buf = this.buffers.get(file);
    if (!buf) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = loop;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(g).connect(this.master!);
    src.start(Math.max(when, ctx.currentTime));
    src.onended = () => this.sources.delete(src);
    this.sources.add(src);
    return src;
  }
}
