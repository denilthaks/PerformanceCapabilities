// Character creation, also used to edit an existing profile.

import { useState, type FormEvent } from 'react';
import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { AVATARS, MAX_NAME_LENGTH, cleanName } from '../../engine/progress-store';
import { PLAYER_LOOKS, PlayerSprite } from '../sprites';
import { VoiceInput } from '../VoiceInput';

export function CreateScreen() {
  const { progress, createPlayer } = useGame();
  const editing = Boolean(progress.player);
  const [name, setName] = useState(progress.player?.name ?? '');
  const [avatar, setAvatar] = useState<string>(progress.player?.avatar ?? AVATARS[0]);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) { setError('The front desk needs a name for your pass.'); return; }
    createPlayer(clean, avatar);
    navigate(editing ? '/settings' : '/play/front-gate');
  };

  return (
    <section className="page narrow create">
      <form className="pass" onSubmit={submit} noValidate>
        <p className="eyebrow pixel-font">Halcyon Tower · staff pass</p>
        <h1>{editing ? 'Update your pass' : 'Your first night starts in the lobby'}</h1>
        <div className="pass-body">
          <div className="pass-photo"><PlayerSprite look={avatar} facing="down" /></div>
          <div className="pass-fields">
            <div className="field">
              <label htmlFor="char-name">Name on your pass</label>
              <input
                id="char-name"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="nickname"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'char-name-error' : undefined}
                onChange={(e) => { setName(e.target.value); setError(''); }}
              />
              <VoiceInput value={name} onChange={(v) => { setName(v); setError(''); }} mode="replace" maxLength={MAX_NAME_LENGTH} label="your name" />
              {error && <p id="char-name-error" className="error">{error}</p>}
            </div>
            <p className="pass-role">Role: <strong>Performance Lead</strong> (new)</p>
          </div>
        </div>
        <fieldset className="field">
          <legend>Look</legend>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <label key={a} className={`avatar-option${avatar === a ? ' selected' : ''}`}>
                <input type="radio" name="avatar" value={a} checked={avatar === a} onChange={() => setAvatar(a)} />
                <PlayerSprite look={a} facing="down" className="avatar-sprite" />
                <span>{PLAYER_LOOKS[a].label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary btn-lg">{editing ? 'Save' : 'Badge in ▸'}</button>
      </form>
    </section>
  );
}
