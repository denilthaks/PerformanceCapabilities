// Character creation, also used to edit an existing profile.

import { useState, type FormEvent } from 'react';
import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { AVATARS, MAX_NAME_LENGTH, cleanName } from '../../engine/progress-store';
import { PLAYER_LOOKS } from '../../content/characters';
import { Portrait } from '../Portrait';

export function CharacterForm({ onDone, submitLabel }: { onDone: () => void; submitLabel: string }) {
  const { progress, createPlayer } = useGame();
  const [name, setName] = useState(progress.player?.name ?? '');
  const [avatar, setAvatar] = useState<string>(progress.player?.avatar ?? AVATARS[0]);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) {
      setError('Enter a name for your character.');
      return;
    }
    createPlayer(clean, avatar);
    onDone();
  };

  return (
    <form className="character-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="char-name">Character name</label>
        <input
          id="char-name"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="nickname"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'char-name-error' : 'char-name-hint'}
          onChange={(e) => { setName(e.target.value); setError(''); }}
        />
        <p id="char-name-hint" className="hint">Shown only on this device. Avoid using your full real name.</p>
        {error && <p id="char-name-error" className="error">{error}</p>}
      </div>
      <fieldset className="field">
        <legend>Appearance</legend>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <label key={a} className={`avatar-option${avatar === a ? ' selected' : ''}`}>
              <input type="radio" name="avatar" value={a} checked={avatar === a} onChange={() => setAvatar(a)} />
              <Portrait look={PLAYER_LOOKS[a].look} size={96} />
              <span>{PLAYER_LOOKS[a].label}</span>
            </label>
          ))}
        </div>
        <p className="hint">Appearance is cosmetic. It doesn't change the story or your scores.</p>
      </fieldset>
      <button type="submit" className="btn btn-primary btn-lg">{submitLabel}</button>
    </form>
  );
}

export function CreateScreen() {
  const { progress } = useGame();
  return (
    <section className="page narrow create">
      <div className="glass panel-pad">
        <p className="eyebrow">{progress.player ? 'Your character' : 'Before you begin'}</p>
        <h1>{progress.player ? 'Edit your character' : 'Create your character'}</h1>
        <p className="lede">
          Your character is how you appear in the world. Other characters will respond to what you decide, not to how you look.
        </p>
        <CharacterForm submitLabel={progress.player ? 'Save character' : 'Enter the world'} onDone={() => navigate(progress.player ? '/settings' : '/journey')} />
      </div>
    </section>
  );
}
