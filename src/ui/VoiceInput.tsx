// Speak instead of type. Wraps a text field and puts two round red buttons
// inside it: a mic (speech-to-text) and a speaker that reads the field back
// (text-to-speech). Typing always works too.
//
// While the mic is on it pulses; the sound wave only appears while the
// browser actually hears speech, and settles as soon as you stop talking.
//
// Speech recognition is the browser's own (Chrome, Edge, Safari). Some
// browsers transcribe on their maker's servers; the mic's tooltip says so.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { readAloud, stopSpeaking } from '../app/voice';

interface RecognitionResult { isFinal: boolean; 0: { transcript: string }; length: number }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
const isAndroid = /Android/i.test(ua);
const isApple = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
const isSafari = /^((?!chrome|chromium|crios|android).)*safari/i.test(ua);
// Phones and Safari won't share the mic between speech recognition and a
// second audio stream, so the live level meter is desktop Chrome/Edge only.
// Everywhere else the wave is driven by the recogniser's own speech events.
const canMeter = !isAndroid && !isApple && !isSafari;

const BARS = 7;
const QUIET_MS = 900;
// Uneven speeds and offsets per bar, so the fallback wave moves like speech, not a ramp.
const BAR_TIMING = [[0.62, -0.3], [0.46, -0.1], [0.7, -0.5], [0.52, 0], [0.66, -0.4], [0.48, -0.2], [0.58, -0.35]];

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it for this site in your browser settings, then try again.',
  'service-not-allowed': 'Voice typing is switched off in this browser. You can type instead.',
  'no-speech': "I didn't hear anything. Tap the mic and try again.",
  'audio-capture': "No microphone was found. Check it's connected, or type instead.",
  network: "Voice typing needs a connection to your browser's speech service. You can type instead.",
  'language-not-supported': "Voice typing isn't available for your language in this browser.",
};

function join(a: string, b: string): string {
  if (!a.trim()) return b.trim();
  if (!b.trim()) return a;
  return `${a.replace(/\s+$/, '')} ${b.trim()}`;
}

export function SpeakerIcon({ muted = false, size = 18 }: { muted?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {muted
        ? <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" /></svg>;
}

export interface VoiceFieldProps {
  /** The input or textarea being filled in. */
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
  /** 'replace' for short answers like a name; 'append' for notes. */
  mode?: 'replace' | 'append';
  maxLength?: number;
  /** What's being filled in, for screen readers: "your name". */
  label: string;
}

export function VoiceField({ children, value, onChange, mode = 'append', maxLength, label }: VoiceFieldProps) {
  const Ctor = recognitionCtor();
  const [listening, setListening] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [metered, setMetered] = useState(false);

  const wantRef = useRef(false); // the player wants the mic on
  const recRef = useRef<Recognition | null>(null);
  const quietRef = useRef(0);
  const meterRef = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /** Speech is coming in: show the wave, and settle it once things go quiet. */
  const heard = () => {
    setHearing(true);
    window.clearTimeout(quietRef.current);
    quietRef.current = window.setTimeout(() => setHearing(false), QUIET_MS);
  };

  const stopMeter = () => {
    const m = meterRef.current;
    meterRef.current = null;
    setMetered(false);
    if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stream.getTracks().forEach((t) => t.stop());
    void m.ctx.close().catch(() => undefined);
  };

  // Desktop Chrome/Edge: shape the bars from the real input level, started
  // only once the recogniser already has the mic.
  const startMeter = async () => {
    if (!canMeter || meterRef.current || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!wantRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const m = { stream, ctx, raf: 0 };
      meterRef.current = m;
      setMetered(true);
      const draw = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const d of data) sum += ((d - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / data.length) * 6);
        const t = performance.now() / 160;
        barsRef.current.forEach((bar, i) => {
          const centre = 1 - Math.abs(i - (BARS - 1) / 2) / BARS;
          const wobble = 0.65 + 0.35 * Math.sin(t + i * 1.7);
          bar.style.transform = `scaleY(${(0.18 + level * centre * wobble * 0.82).toFixed(3)})`;
        });
        m.raf = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      // No meter: the wave animates from speech events instead.
    }
  };

  const finish = () => {
    wantRef.current = false;
    recRef.current = null;
    window.clearTimeout(quietRef.current);
    setListening(false);
    setHearing(false);
    stopMeter();
  };

  /** One recognition session. Android repeats text in continuous mode, so there each phrase is its own session. */
  const session = (first: boolean) => {
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-GB';
    rec.continuous = mode === 'append' && !isAndroid;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    const base = mode === 'replace' ? '' : valueRef.current;
    let gotSpeech = false;
    let failed = false;

    rec.onaudiostart = () => { void startMeter(); };
    rec.onspeechstart = () => heard();
    rec.onspeechend = () => {
      window.clearTimeout(quietRef.current);
      quietRef.current = window.setTimeout(() => setHearing(false), 250);
    };
    rec.onresult = (e) => {
      // Rebuild from every result each time, so nothing is counted twice.
      let finals = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals = join(finals, r[0].transcript);
        else interim = join(interim, r[0].transcript);
      }
      const spoken = join(finals, interim);
      if (!spoken) return;
      gotSpeech = true;
      heard();
      let text = mode === 'replace' ? spoken.replace(/[.!?]+$/, '') : join(base, spoken);
      if (maxLength) text = text.slice(0, maxLength);
      onChangeRef.current(text);
    };
    rec.onerror = (e) => {
      failed = true;
      // Silence after the player has already spoken just means they're done.
      if (e.error === 'aborted' || (e.error === 'no-speech' && !first)) return;
      setError(ERRORS[e.error] ?? 'Voice typing stopped unexpectedly. Tap the mic to try again.');
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      // Keep listening across pauses in a note, until the player taps stop.
      if (wantRef.current && mode === 'append' && isAndroid && gotSpeech && !failed) { session(false); return; }
      finish();
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('Voice typing could not start. Please try again.');
      finish();
    }
  };

  const start = () => {
    if (!Ctor) return;
    stopSpeaking();
    setReading(false);
    setError('');
    wantRef.current = true;
    setListening(true);
    session(true);
  };

  const stop = () => {
    wantRef.current = false;
    recRef.current?.stop();
  };

  const toggleRead = () => {
    if (reading) { stopSpeaking(); setReading(false); return; }
    if (readAloud(value, () => setReading(false))) setReading(true);
  };

  useEffect(() => () => {
    wantRef.current = false;
    recRef.current?.abort();
    recRef.current = null;
    window.clearTimeout(quietRef.current);
    stopMeter();
  }, []);

  const canRead = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className={`voice-field voice-${mode}${listening ? ' listening' : ''}${hearing ? ' hearing' : ''}`}>
      {children}
      <div className="voice-controls">
        <span className={`wave${metered ? ' metered' : ''}`} aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => (
            <span key={i} ref={(el) => { if (el) barsRef.current[i] = el; }} style={{ animationDuration: `${BAR_TIMING[i][0]}s`, animationDelay: `${BAR_TIMING[i][1]}s` }} />
          ))}
        </span>
        {canRead && !listening && (
          <button
            type="button"
            className="round-btn read-btn"
            onClick={toggleRead}
            disabled={!value.trim()}
            aria-pressed={reading}
            aria-label={reading ? 'Stop reading aloud' : `Read ${label} aloud`}
            title={reading ? 'Stop' : 'Read it aloud'}
          >
            {reading ? <StopIcon /> : <SpeakerIcon />}
          </button>
        )}
        <button
          type="button"
          className="round-btn mic-btn"
          data-silent=""
          onClick={listening ? stop : start}
          disabled={!Ctor}
          aria-pressed={listening}
          aria-label={listening ? 'Stop voice typing' : `Say ${label} instead of typing`}
          title={!Ctor
            ? 'Voice typing works in Chrome, Edge and Safari'
            : listening ? 'Stop' : 'Speak instead of typing. Your browser turns speech into text, sometimes on its own servers.'}
        >
          {listening ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
      <span className="visually-hidden" role="status">{listening ? 'Listening' : ''}</span>
      {error && <p className="voice-error" role="alert">{error}</p>}
    </div>
  );
}
