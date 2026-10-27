import { useGame } from '../../app/game';
import { continuePath } from '../../engine/progression';
import { ZONES } from '../../content/zones';
import { Icon, Link } from '../common';

export function HomeScreen() {
  const { progress } = useGame();
  const cont = continuePath(progress, ZONES);
  const name = progress.player?.name;

  return (
    <section className="home">
      <div className="home-hero">
        <p className="eyebrow">Performance Capability · The Journey</p>
        <h1 className="home-title">
          <span>Discover how you perform.</span>
          <span>Develop how you think.</span>
          <span className="accent">Change what you achieve.</span>
        </h1>
        <p className="home-lede">
          {name
            ? `Welcome back, ${name}. The world has kept your place.`
            : 'Step into a world of difficult situations. Investigate, decide and live with the consequences. Then see what your approach reveals.'}
        </p>
        <div className="home-actions">
          <Link to={cont} className="btn btn-primary btn-lg">
            {progress.player ? 'Continue Journey' : 'Begin the Journey'}<Icon name="arrow" />
          </Link>
          <Link to="/journey" className="btn btn-ghost btn-lg"><Icon name="map" />View the world</Link>
        </div>
      </div>

      <ol className="home-steps" aria-label="How it works">
        <li><span className="step-num">01</span><strong>Investigate</strong><span>Talk to people and examine the evidence before you act.</span></li>
        <li><span className="step-num">02</span><strong>Decide</strong><span>Choose a response. Every option has consequences for real-feeling people.</span></li>
        <li><span className="step-num">03</span><strong>Reflect</strong><span>See why it played out that way, then replay with a different approach.</span></li>
      </ol>

      <aside className="home-note">
        <img src="./brand/performance-capability-logo.png" alt="Performance Capability: The Psychology of Human Excellence" width="120" height="156" className="logo-plate" />
        <p>
          Inspired by Ben Benson's <Link to="/principles">Performance Capability framework</Link>. This game helps you reflect on specific decisions and behaviours.
          It does not measure or label your overall capability.
        </p>
      </aside>
    </section>
  );
}
