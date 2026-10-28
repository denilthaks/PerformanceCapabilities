// Speak instead of type. A red mic sits beside a text field: press it, talk,
// and your words appear in the field as you go (speech-to-text). A second
// button reads the field back to you (text-to-speech). Typing always works
// too: the mic only ever adds to what's there.
//
// Speech recognition is the browser's own (Chrome, Edge, Safari). Some
// browsers send the audio to their maker's servers to transcribe it, which
// is why the player is told so on first use.

import { useEffect, useRef, useState } from 'react';
import { readAloud, stopSpeaking } from '../app/voice';

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const BARS = 9;
const PRIVACY_KEY = 'pc-journey.mic-note-seen';

// Android won't let speech recognition and a second audio stream share the
// mic, so there the wave is animated from speech events instead of measured.
const canMeasure = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && !/Android/i.test(navigator.userAgent);

function join(a: string, b: string): string {
  if (!a.trim()) return b.trim();
  if (!b.trim()) return a;
  return `${a.replace(/\s+$/, '')} ${b.trim()}`;
}

export interface VoiceInputProps {
  /** Current text in the field. */
  value: string;
  onChange: (value: string) => void;
  /** 'replace' for short answers like a name; 'append' for notes. */
  mode?: 'replace' | 'append';
  maxLength?: number;
  /** What's being filled in, for screen readers: "your name". */
  label: string;
}

export function VoiceInput({ value, onChange, mode = 'append', maxLength, label }: VoiceInputProps) {
  const Ctor = recognitionCtor();
  const [listening, setListening] = useState(false);
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState('');
  const [measured, setMeasured] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const valueRef = useRef(value);
  valueRef.current = value;

  const stopWave = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setMeasured(false);
  };

  const startWave = async () => {
    if (!canMeasure()) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!recRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      setMeasured(true);
      const draw = () => {
        analyser.getByteFrequencyData(data);
        barsRef.current.forEach((bar, i) => {
          // Spread the voice band (the lower bins) across the bars, loudest in the middle.
          const v = data[1 + Math.floor((i / BARS) * (data.length * 0.6))] / 255;
          const centre = 1 - Math.abs(i - (BARS - 1) / 2) / BARS;
          bar.style.transform = `scaleY(${(0.15 + v * 0.85 * (0.6 + centre * 0.4)).toFixed(3)})`;
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      // No separate stream: the animated wave stands in.
    }
  };

  const stop = () => {
    recRef.current?.stop();
  };

  const start = () => {
    if (!Ctor) return;
    stopSpeaking();
    setReading(false);
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-GB';
    rec.continuous = mode === 'append';
    rec.interimResults = true;
    const base = mode === 'replace' ? '' : valueRef.current;
    let finals = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals = join(finals, r[0].transcript);
        else interim = join(interim, r[0].transcript);
      }
      let text = join(base, join(finals, interim));
      // A name doesn't end with a full stop.
      if (mode === 'replace') text = text.replace(/[.!?]+$/, '');
      if (maxLength) text = text.slice(0, maxLength);
      onChange(text);
      setStatus('Listening…');
    };
    rec.onerror = (e) => {
      const msg: Record<string, string> = {
        'not-allowed': 'The microphone is blocked. Allow it in your browser settings, or just type.',
        'service-not-allowed': 'Voice typing is turned off in this browser. You can still type.',
        'no-speech': "I didn't catch anything. Tap the mic and try again.",
        'audio-capture': "I couldn't find a microphone. You can still type.",
        network: 'Voice typing needs an internet connection. You can still type.',
      };
      if (e.error !== 'aborted') setStatus(msg[e.error] ?? 'Voice typing stopped. Tap the mic to try again.');
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      stopWave();
      setStatus((s) => (s === 'Listening…' ? 'Got it. Edit it if anything looks off.' : s));
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setStatus('Voice typing could not start. You can still type.');
      return;
    }
    setListening(true);
    let seen = false;
    try { seen = localStorage.getItem(PRIVACY_KEY) === '1'; localStorage.setItem(PRIVACY_KEY, '1'); } catch { /* fine */ }
    setStatus(seen ? 'Listening… speak now.' : 'Listening… speak now. Your browser turns speech into text, and some browsers do that on their own servers.');
    void startWave();
  };

  const toggleRead = () => {
    if (reading) { stopSpeaking(); setReading(false); return; }
    if (readAloud(value, () => setReading(false))) setReading(true);
  };

  useEffect(() => () => {
    recRef.current?.abort();
    recRef.current = null;
    stopWave();
  }, []);

  const canRead = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className={`voice-input${listening ? ' listening' : ''}`}>
      <button
        type="button"
        className="mic-btn"
        onClick={listening ? stop : start}
        disabled={!Ctor}
        aria-pressed={listening}
        aria-label={listening ? 'Stop voice typing' : `Speak ${label} instead of typing`}
        title={Ctor ? (listening ? 'Stop' : 'Speak instead of typing') : 'Voice typing works in Chrome, Edge and Safari'}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
          <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className={`wave${measured ? ' measured' : ''}`} aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} ref={(el) => { if (el) barsRef.current[i] = el; }} style={{ animationDelay: `${(i % 5) * -0.13}s` }} />
        ))}
      </span>
      {canRead && (
        <button
          type="button"
          className="read-btn"
          onClick={toggleRead}
          disabled={!value.trim() || listening}
          aria-pressed={reading}
          aria-label={reading ? 'Stop reading' : `Read ${label} aloud`}
          title={reading ? 'Stop reading' : 'Read it back to me'}
        >
          {reading ? '■' : '🔈'}
        </button>
      )}
      <p className="voice-status" role="status" aria-live="polite">
        {Ctor ? status : 'Voice typing works in Chrome, Edge and Safari. You can type here as normal.'}
      </p>
    </div>
  );
}
