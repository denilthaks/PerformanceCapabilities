// Spoken dialogue. Lines with a recorded voice file (generated ahead of time
// with ElevenLabs by tools/generate-voices.ts) play that file; any other line
// falls back to the device's built-in text-to-speech, using its best English
// voice at a natural pitch. No API key is ever needed in the browser.

import { speechText, voiceKey } from './voice-lines';

let enabled = true;
let voices: SpeechSynthesisVoice[] = [];

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

// Higher-quality voices first. Browsers ship basic "compact" voices alongside
// neural or enhanced ones; the names tell them apart.
function quality(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let q = 0;
  if (/natural|neural|premium|enhanced|wavenet|online/.test(n)) q += 4;
  if (/google|microsoft|siri|samantha|daniel|karen|serena|moira|arthur|aria|jenny|guy|sonia|libby|ryan/.test(n)) q += 2;
  if (/^en-(gb|us|au|ie|ca)/i.test(v.lang)) q += 1;
  if (/compact|espeak|robot|novelty|whisper|bells|bad news|zarvox|trinoids|albert|cellos/.test(n)) q -= 6;
  if (v.localService === false) q += 1; // network voices tend to sound more natural
  return q;
}

function loadVoices() {
  if (!supported) return;
  const all = window.speechSynthesis.getVoices();
  const english = all.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const pool = (english.length ? english : all).slice().sort((a, b) => quality(b) - quality(a));
  // Keep only the best few, so no character is stuck with a poor voice.
  const best = pool.length ? quality(pool[0]) : 0;
  voices = pool.filter((v, i) => i < 6 && quality(v) >= best - 2);
}

if (supported) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on) stopSpeaking();
}

export function voiceSupported(): boolean {
  return supported;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * A stable voice and pace for each speaker. Pitch stays close to natural:
 * shifting it far is what makes text-to-speech sound robotic.
 */
function profile(speaker: string): { voice?: SpeechSynthesisVoice; pitch: number; rate: number } {
  if (speaker === 'narrator') return { voice: voices[0], pitch: 0.98, rate: 0.97 };
  const h = hash(speaker);
  return {
    voice: voices.length ? voices[h % voices.length] : undefined,
    pitch: 0.96 + ((h >> 4) % 9) / 100, // 0.96 – 1.04
    rate: 0.97 + ((h >> 10) % 7) / 100, // 0.97 – 1.03
  };
}

function utterance(text: string, speaker: string): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(speechText(text));
  const p = profile(speaker);
  if (p.voice) u.voice = p.voice;
  u.pitch = p.pitch;
  u.rate = p.rate;
  return u;
}

// ---- Recorded voices (ElevenLabs, generated ahead of time) ----

let manifest: Record<string, string> | null = null;
let manifestLoad: Promise<void> | null = null;

function loadManifest(): Promise<void> {
  manifestLoad ??= fetch('./voice/manifest.json')
    .then((r) => (r.ok ? r.json() : { files: {} }))
    .then((m: { files?: Record<string, string> }) => { manifest = m.files ?? {}; })
    .catch(() => { manifest = {}; });
  return manifestLoad;
}

/** Whether any recorded voice files are available (after the manifest loads). */
export function recordedVoices(): number {
  return manifest ? Object.keys(manifest).length : 0;
}

// One queue for both kinds of speech, so recorded and device lines can mix.
let queue: { text: string; speaker: string }[] = [];
let audio: HTMLAudioElement | null = null;
let generation = 0;

function next(gen: number) {
  if (gen !== generation) return;
  const item = queue.shift();
  if (!item) return;
  const file = manifest?.[voiceKey(item.speaker, item.text)];
  if (file) {
    audio = new Audio(`./voice/${file}`);
    audio.onended = () => next(gen);
    audio.onerror = () => { audio = null; deviceSpeak(item, gen); };
    audio.play().catch(() => { audio = null; deviceSpeak(item, gen); });
    return;
  }
  deviceSpeak(item, gen);
}

/**
 * Speak with the device voice: this line and any following lines that have
 * no recording go to the browser's own queue together (some phones don't
 * report when an utterance ends, which would otherwise stall the queue).
 */
function deviceSpeak(item: { text: string; speaker: string }, gen: number) {
  const batch = [item];
  while (queue.length && !manifest?.[voiceKey(queue[0].speaker, queue[0].text)]) batch.push(queue.shift()!);
  if (!supported) { next(gen); return; }
  try {
    batch.forEach((b, i) => {
      const u = utterance(b.text, b.speaker);
      if (i === batch.length - 1) { u.onend = () => next(gen); u.onerror = () => next(gen); }
      window.speechSynthesis.speak(u);
    });
  } catch {
    next(gen);
  }
}

/** Speak one line, interrupting anything already being said. */
export function speak(text: string, speaker: string) {
  speakAll([{ text, speaker }]);
}

/** Speak several lines in order (e.g. everyone's reactions). */
export function speakAll(lines: { text: string; speaker: string }[]) {
  if (!enabled) return;
  stopSpeaking();
  queue = lines.filter((l) => speechText(l.text));
  if (!queue.length) return;
  const gen = generation;
  if (manifest) next(gen);
  else void loadManifest().then(() => next(gen));
}

export function stopSpeaking() {
  generation++;
  queue = [];
  if (audio) { audio.pause(); audio.onended = null; audio = null; }
  if (supported) {
    try { window.speechSynthesis.cancel(); } catch { /* nothing to stop */ }
  }
}

/**
 * Read the player's own words back to them with the device voice. Runs even
 * when voice-over is off, because the player asked for it. Returns false if
 * this browser can't speak.
 */
export function readAloud(text: string, onDone?: () => void): boolean {
  stopSpeaking();
  if (!supported || !speechText(text)) return false;
  const u = utterance(text, 'player');
  u.onend = () => onDone?.();
  u.onerror = () => onDone?.();
  window.speechSynthesis.speak(u);
  return true;
}
