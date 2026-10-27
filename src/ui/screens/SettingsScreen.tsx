// Profile, preferences and reset.

import { useRef } from 'react';
import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import type { Motion, TextSize } from '../../engine/progress-store';
import { Link } from '../common';
import { PLAYER_LOOKS, PlayerPortrait } from '../sprites';
import { voiceSupported } from '../../app/voice';

function Choice<T extends string>({ legend, name, value, options, onChange, hint }: {
  legend: string; name: string; value: T; options: { value: T; label: string }[]; onChange(v: T): void; hint?: string;
}) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="segmented">
        {options.map((o) => (
          <label key={o.value} className={value === o.value ? 'selected' : ''}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </fieldset>
  );
}

export function SettingsScreen() {
  const { progress, updateSettings, reset, storageAvailable } = useGame();
  const dialog = useRef<HTMLDialogElement>(null);
  const s = progress.settings;
  const p = progress.player;

  const openConfirm = () => dialog.current?.showModal();
  const closeConfirm = () => dialog.current?.close();

  return (
    <section className="page narrow-wide">
      <header className="page-head">
        <p className="eyebrow">Profile & Settings</p>
        <h1>Profile and settings</h1>
      </header>

      <section className="glass panel-pad profile">
        <h2>Profile</h2>
        {p ? (
          <div className="row">
            <PlayerPortrait look={p.avatar} size={72} />
            <span><strong>{p.name}</strong><br /><span className="muted">{PLAYER_LOOKS[p.avatar].label}</span></span>
            <Link to="/create" className="btn btn-ghost btn-sm">Edit pass</Link>
          </div>
        ) : (
          <p>No pass yet. <Link to="/create" className="btn btn-primary btn-sm">Get your pass</Link></p>
        )}
      </section>

      <section className="glass panel-pad">
        <h2>Accessibility and display</h2>
        <Choice<Motion> legend="Motion" name="motion" value={s.motion} onChange={(v) => updateSettings({ motion: v })}
          options={[{ value: 'system', label: 'Match my device' }, { value: 'reduce', label: 'Reduce' }, { value: 'full', label: 'Full' }]}
          hint="Reduce turns off walking animation, typed-out dialogue and room effects. Your character moves instantly." />
        <Choice<'on' | 'off'> legend="Sound effects" name="sound" value={s.sound ? 'on' : 'off'} onChange={(v) => updateSettings({ sound: v === 'on' })}
          options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} />
        <Choice<'on' | 'off'> legend="Voice-over" name="voice" value={s.voice ? 'on' : 'off'} onChange={(v) => updateSettings({ voice: v === 'on' })}
          options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
          hint={voiceSupported() ? 'Characters speak their lines using your device\'s built-in voices, so they sound different on different devices.' : 'Your browser doesn\'t support speech, so dialogue is text only.'} />
        <Choice<TextSize> legend="Text size" name="text" value={s.textSize} onChange={(v) => updateSettings({ textSize: v })}
          options={[{ value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }]} />
      </section>

      <section className="glass panel-pad">
        <h2>Your data</h2>
        <p>
          Progress is saved in this browser's local storage on this device only. Nothing is sent to a server.
          This is a demonstration store, not secure multi-user persistence: anyone using this browser can see or change it, and clearing browser data removes it.
        </p>
        {!storageAvailable && <p className="error">Local storage is blocked in this browser, so progress will not survive a refresh.</p>}
        <button type="button" className="btn btn-danger" onClick={openConfirm}>Reset all progress</button>
      </section>

      <dialog ref={dialog} className="confirm glass" aria-labelledby="reset-title">
        <h2 id="reset-title">Reset all progress?</h2>
        <p>This permanently deletes your pass, medals, memos, notebook and clue archive from this browser. It can't be undone.</p>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={closeConfirm} autoFocus>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { reset(); closeConfirm(); navigate('/'); }}>Yes, reset everything</button>
        </div>
      </dialog>
    </section>
  );
}
