// The RPG dialogue box: one line at a time, typed out, with the speaker's
// pixel portrait. Click, tap or press Enter to advance.

import { useEffect, useRef, useState } from 'react';
import type { Line } from '../../engine/types';
import { characterById } from '../../content/characters';
import { useGame } from '../../app/game';
import { PlayerPortrait, Portrait } from '../sprites';
import { speak, stopSpeaking } from '../../app/voice';

const CPS = 55; // characters per second

export function Speaker({ id }: { id: string }) {
  const { progress } = useGame();
  if (id === 'narrator') return null;
  if (id === 'player') return <PlayerPortrait look={progress.player?.avatar ?? 'ember'} size={64} />;
  return <Portrait characterId={id} size={64} />;
}

export function speakerName(id: string, playerName?: string): string {
  if (id === 'player') return playerName || 'You';
  return characterById(id)?.name ?? '';
}

interface Props {
  lines: Line[];
  reducedMotion: boolean;
  onDone?: () => void;
  resetKey?: string;
  /** Shown once the last line is visible (e.g. a Continue button). */
  after?: React.ReactNode;
}

export function Dialogue({ lines, reducedMotion, onDone, resetKey, after }: Props) {
  const { progress } = useGame();
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(reducedMotion ? Infinity : 0);
  const next = useRef<HTMLButtonElement>(null);
  const line = lines[Math.min(index, lines.length - 1)];
  const full = line ? line.text.length : 0;
  const typed = chars >= full;
  const lastLine = index >= lines.length - 1;
  const done = lastLine && typed;

  useEffect(() => { setIndex(0); setChars(reducedMotion ? Infinity : 0); }, [resetKey, reducedMotion]);
  useEffect(() => {
    if (typed || reducedMotion) return;
    const t = window.setInterval(() => setChars((c) => c + 1), 1000 / CPS);
    return () => window.clearInterval(t);
  }, [typed, reducedMotion, index]);
  useEffect(() => { if (done) onDone?.(); }, [done, onDone]);
  // Voice-over: each line is spoken as it appears, in that character's voice.
  const text = line?.text;
  const speaker = line?.speaker;
  useEffect(() => { if (text && speaker) speak(text, speaker); }, [text, speaker, index, resetKey]);
  useEffect(() => () => stopSpeaking(), []);

  if (!line) return null;

  const advance = () => {
    if (!typed) { setChars(Infinity); return; }
    if (!lastLine) { setIndex((i) => i + 1); setChars(reducedMotion ? Infinity : 0); }
  };

  const narrator = line.speaker === 'narrator';
  return (
    <div className={`dialogue-box${narrator ? ' narrator' : ''}${line.speaker === 'player' ? ' player' : ''}`}>
      <Speaker id={line.speaker} />
      <div className="dialogue-body">
        {!narrator && <span className="dialogue-name">{speakerName(line.speaker, progress.player?.name)}</span>}
        <p className="dialogue-text" aria-live="polite" onClick={advance}>
          <span>{line.text.slice(0, chars)}</span>
          {/* Reserve the full line's space so the box doesn't jump while typing. */}
          <span className="ghost" aria-hidden="true">{line.text.slice(chars)}</span>
        </p>
        <div className="dialogue-actions">
          {!done && (
            <button ref={next} type="button" className="btn btn-pixel" onClick={advance} autoFocus>
              {typed ? 'Next ▸' : 'Skip ▸'}
            </button>
          )}
          {!done && lines.length > 1 && (
            <button type="button" className="btn btn-text btn-sm" onClick={() => { setIndex(lines.length - 1); setChars(Infinity); }}>Skip all</button>
          )}
          {done && after}
          <span className="dialogue-count" aria-hidden="true">{index + 1}/{lines.length}</span>
        </div>
      </div>
    </div>
  );
}
