// Interface sound effects, synthesized with the Web Audio API: no audio files
// to download. Browsers only allow audio after the player's first click or
// key press, so the context is created lazily on the first sound.

export type Sfx = 'click' | 'select' | 'confirm' | 'discover' | 'secret' | 'medal';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return { ctx, out: master! };
  } catch {
    return null;
  }
}

/** One enveloped oscillator note. */
function tone(freq: number, start: number, dur: number, { type = 'triangle' as OscillatorType, gain = 1, slideTo = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + start;
  const osc = a.ctx.createOscillator();
  const env = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(a.out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function play(sfx: Sfx) {
  switch (sfx) {
    case 'click':
      tone(740, 0, 0.06, { type: 'square', gain: 0.25, slideTo: 520 });
      break;
    case 'select':
      tone(660, 0, 0.07, { type: 'square', gain: 0.25 });
      tone(880, 0.05, 0.08, { type: 'square', gain: 0.22 });
      break;
    case 'confirm':
      [523, 659, 784].forEach((f, i) => tone(f, i * 0.06, 0.14, { type: 'triangle', gain: 0.6 }));
      break;
    case 'discover':
      tone(988, 0, 0.18, { type: 'sine', gain: 0.5 });
      tone(1319, 0.08, 0.26, { type: 'sine', gain: 0.4 });
      break;
    case 'secret':
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.08, 0.3, { type: 'sine', gain: 0.35 }));
      break;
    case 'medal':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, { type: 'triangle', gain: 0.6 }));
      tone(1047, 0.48, 0.7, { type: 'sine', gain: 0.4 });
      break;
  }
}

/**
 * Give every button and link-button a click sound, chosen by what it does.
 * Specific moments (a discovery, a medal) call play() directly.
 */
export function installClickSounds(): () => void {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest('button, a.btn, a.floor-window, a.zone-card-link, .reply, .check, .avatar-option, .segmented label');
    if (!el || (el as HTMLButtonElement).disabled) return;
    if (el.matches('.btn-primary')) play('confirm');
    else if (el.matches('.reply, .chip, .check, .avatar-option, .segmented label')) play('select');
    else play('click');
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
