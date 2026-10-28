// Spoken dialogue through the browser's built-in text-to-speech (Web Speech
// API). Each character gets a consistent voice: one of the device's best
// English voices, at a natural pitch. Quality still depends on the device's
// voices; recorded audio would be needed for truly natural speech. If the
// browser has no speech support, the game is silent and otherwise unchanged.

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
