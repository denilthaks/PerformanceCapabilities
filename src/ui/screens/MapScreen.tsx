// The world map: Halcyon Tower in cross-section. Each floor is its room's art;
// the elevator shaft shows where you are and which floors it will stop at.

import { useGame } from '../../app/game';
import { record } from '../../engine/progress-store';
import { zoneState, type ZoneState } from '../../engine/progression';
import { ZONES } from '../../content/zones';
import { Icon, Link } from '../common';
import { MedalIcon, MEDAL_NAMES } from '../medals';
import { PlayerSprite, RoomArt } from '../sprites';

const STATE_TEXT: Record<ZoneState, string> = { locked: 'Elevator won\'t stop', open: 'Open', 'in-progress': 'In progress', complete: 'Resolved' };

export function MapScreen() {
  const { progress } = useGame();
  const states = Object.fromEntries(ZONES.map((z) => [z.id, zoneState(progress, z, ZONES)])) as Record<string, ZoneState>;
  const current = ZONES.find((z) => states[z.id] === 'in-progress') ?? ZONES.find((z) => states[z.id] === 'open') ?? [...ZONES].reverse().find((z) => states[z.id] === 'complete');
  const floors = [...ZONES].reverse();

  return (
    <section className="page tower-page">
      <header className="page-head">
        <p className="eyebrow pixel-font">The Journey</p>
        <h1>Halcyon Tower</h1>
        {!progress.player && (
          <p className="callout">You don't have a pass yet. <Link to="/create" className="btn btn-primary btn-sm">Get your pass</Link></p>
        )}
      </header>

      <ol className="tower" aria-label="Floors of the Tower, top to bottom">
        {floors.map((z) => {
          const st = states[z.id];
          const medal = z.scenarioIds.map((id) => record(progress, id).bestMedal).find(Boolean) ?? null;
          const here = progress.player && current?.id === z.id;
          return (
            <li key={z.id} className={`floor state-${st}${here ? ' here' : ''}`}>
              <div className="shaft" aria-hidden="true">
                <span className="floor-num">{z.floor === 'Ground' ? 'G' : z.floor}</span>
                {here && <PlayerSprite look={progress.player!.avatar} facing="down" className="shaft-player" />}
              </div>
              <Link to={`/zone/${z.id}`} className="floor-window" data-tilt>
                <RoomArt room={z.room} crop={[40, 200]} />
                <span className="floor-info">
                  <span className="floor-name">{z.place}</span>
                  <span className="floor-sub">Zone {z.number} · {z.name}</span>
                  <span className={`pill state-${st}`}>
                    {st === 'locked' && <Icon name="lock" size={14} />}
                    {STATE_TEXT[st]}
                    {here && st !== 'complete' ? ' · you are here' : ''}
                  </span>
                </span>
                {medal && <span className="floor-medal"><MedalIcon medal={medal} size={32} label={`${MEDAL_NAMES[medal]} medal`} /></span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
