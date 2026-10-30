import { useGame } from '../../app/game';
import { continuePath } from '../../engine/progression';
import { ZONES } from '../../content/zones';
import { Link } from '../common';
import { DragonHero } from '../hero/DragonHero';

export function HomeScreen() {
  const { progress } = useGame();
  const cont = continuePath(progress, ZONES);
  const name = progress.player?.name;

  return (
    <section className="home">
      <DragonHero />
      <div className="home-hero">
        <p className="eyebrow pixel-font">Halcyon Tower · your first week</p>
        <h1 className="home-title">
          <span>Four floors.</span>
          <span>Four problems nobody has solved.</span>
          <span className="accent">One new performance lead.</span>
        </h1>
        <p className="home-lede">
          {name
            ? `Welcome back, ${name}. The elevator is waiting.`
            : 'Talk to people. Find what they missed. Decide, and live with what happens next.'}
        </p>
        <div className="home-actions">
          <Link to={cont} className="btn btn-primary btn-lg">{progress.player ? 'Continue ▸' : 'Walk in ▸'}</Link>
          <Link to="/journey" className="btn btn-ghost btn-lg">See the Tower</Link>
        </div>
      </div>
      <p className="home-note">
        <img src="./brand/performance-capability-mark.png" alt="" width="28" height="28" className="logo-chip" />
        Inspired by Ben Benson's <Link to="/principles">Performance Capability framework</Link>. An independent prototype.
      </p>
    </section>
  );
}
