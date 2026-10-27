// Spoken dialogue through the browser's built-in text-to-speech (Web Speech
// API). Each character gets a consistent voice: one of the browser's English
// voices plus their own pitch and pace. Quality depends on the device; if the
// browser has no speech support, the game is silent and otherwise unchanged.

let enabled = true;
let voices: SpeechSynthesisVoice[] = [];

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function loadVoices() {
  if (!supported) return;
  const all = window.speechSynthesis.getVoices();
  const english = all.filter((v) => /^en(-|_|$)/i.test(v.lang));
  voices = english.length ? english : all;
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

/** A stable voice, pitch and pace for each speaker. */
function profile(speaker: string): { voice?: SpeechSynthesisVoice; pitch: number; rate: number } {
  if (speaker === 'narrator') return { voice: voices[0], pitch: 0.85, rate: 0.95 };
  const h = hash(speaker);
  return {
    voice: voices.length ? voices[h % voices.length] : undefined,
    pitch: 0.8 + ((h >> 4) % 50) / 100, // 0.8 – 1.29
    rate: 0.95 + ((h >> 10) % 14) / 100, // 0.95 – 1.08
  };
}

function utterance(text: string, speaker: string): SpeechSynthesisUtterance {
  // Stage directions in brackets aren't spoken.
  const u = new SpeechSynthesisUtterance(text.replace(/\([^)]*\)/g, '').replace(/[“”"]/g, '').trim());
  const p = profile(speaker);
  if (p.voice) u.voice = p.voice;
  u.pitch = p.pitch;
  u.rate = p.rate;
  return u;
}

/** Speak one line, interrupting anything already being said. */
export function speak(text: string, speaker: string) {
  speakAll([{ text, speaker }]);
}

/** Speak several lines in order (e.g. everyone's reactions). */
export function speakAll(lines: { text: string; speaker: string }[]) {
  if (!supported || !enabled || !lines.length) return;
  try {
    window.speechSynthesis.cancel();
    for (const l of lines) if (l.text.trim()) window.speechSynthesis.speak(utterance(l.text, l.speaker));
  } catch {
    /* speech is a nice-to-have */
  }
}

export function stopSpeaking() {
  if (!supported) return;
  try { window.speechSynthesis.cancel(); } catch { /* nothing to stop */ }
}
