// Dialogue shown a line at a time, with speaker portraits.

import { useEffect, useRef, useState } from 'react';
import type { Line } from '../../engine/types';
import { characterById, PLAYER_LOOKS } from '../../content/characters';
import { useGame } from '../../app/game';
import { Portrait } from '../Portrait';

export function SpeakerLine({ line }: { line: Line }) {
  const { progress } = useGame();
  if (line.speaker === 'narrator') return <p className="line line-narrator">{line.text}</p>;
  const isPlayer = line.speaker === 'player';
  const c = isPlayer ? null : characterById(line.speaker);
  const look = isPlayer ? PLAYER_LOOKS[progress.player?.avatar ?? 'ember'].look : c?.look;
  const name = isPlayer ? progress.player?.name ?? 'You' : c?.name ?? line.speaker;
  return (
    <div className={`line line-speech${isPlayer ? ' line-player' : ''}`}>
      {look && <Portrait look={look} size={44} />}
      <div>
        <span className="line-name">{name}</span>
        <p>{line.text}</p>
      </div>
    </div>
  );
}

/** Reveals lines one by one. Calls onDone once every line is visible. */
export function Dialogue({ lines, onDone, resetKey }: { lines: Line[]; onDone?: () => void; resetKey?: string }) {
  const [shown, setShown] = useState(1);
  const end = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const done = shown >= lines.length;

  useEffect(() => { setShown(1); }, [resetKey]);
  useEffect(() => { if (done) onDone?.(); }, [done, onDone]);
  useEffect(() => {
    if (shown > 1) end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [shown]);

  return (
    <div className="dialogue">
      <div className="dialogue-lines" aria-live="polite">
        {lines.slice(0, shown).map((l, i) => <SpeakerLine key={i} line={l} />)}
        <div ref={end} />
      </div>
      {!done && (
        <div className="row">
          <button ref={next} type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + 1)}>Next</button>
          <button type="button" className="btn btn-text" onClick={() => setShown(lines.length)}>Show all</button>
        </div>
      )}
    </div>
  );
}
