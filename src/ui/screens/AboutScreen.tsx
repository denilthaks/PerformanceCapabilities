// About Ben. Only claims found in Performance Capability's own published
// material; anything else is a labelled placeholder for Ben to complete.

import { SOURCES } from '../../content/principles';
import { StatusBadge } from '../common';

const LINKS = [
  { label: 'Performance Capability (official website)', url: SOURCES.site.url },
  { label: 'Performance Capability shop', url: SOURCES.shop.url },
  { label: 'Ben Benson Performance Capability Network (podcast)', url: SOURCES.podcast.url },
  { label: "Founder's Note", url: SOURCES.founders.url },
];

export function AboutScreen() {
  return (
    <section className="page narrow-wide about">
      <header className="page-head">
        <p className="eyebrow">About Ben</p>
        <h1>Ben Benson and Performance Capability</h1>
      </header>

      <div className="about-grid">
        <div className="logo-plate large">
          <img src="./brand/performance-capability-logo.png" alt="Performance Capability: The Psychology of Human Excellence" width="240" height="311" />
        </div>
        <div className="glass panel-pad">
          <h2>Introduction <StatusBadge status="summary" /></h2>
          <p>
            Ben Benson is the founder of Performance Capability, which operates performancecapability.com. In his Founder's Note he presents
            Performance Capability as more than a business: a movement, a philosophy and a new model of effectiveness.
          </p>
          <p>
            Performance Capability's work centres on the relationship between capability and performance. It is organised around the
            Performance Capability Trisphereon: three interconnected levels (Transactional, Transformational and Transcendental), with four principles at each.
          </p>
          <p>
            Ben also hosts the podcast <em>Ben Benson Performance Capability Network</em>, which explores the framework's principles, and
            Performance Capability offers coaching, training and an online shop.
          </p>
          <p className="hint">Summarised from Performance Capability's published pages. Wording to be confirmed by Ben.</p>
        </div>
      </div>

      <section className="glass panel-pad placeholder-box">
        <h2>Biography <StatusBadge status="placeholder" /></h2>
        <p>
          A fuller biography, background and credentials could not be verified from the official site for this prototype, so none are given here.
          This section is a placeholder for Ben to supply in his own words.
        </p>
      </section>

      <section className="glass panel-pad">
        <h2>Official links</h2>
        <ul className="link-list">
          {LINKS.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a></li>)}
        </ul>
      </section>

      <section className="glass panel-pad">
        <h2>About this prototype</h2>
        <p>
          <em>Performance Capability: The Journey</em> is an independent prototype that explores how the framework could become a character-based learning game.
          It has not been reviewed or approved by Ben Benson or Performance Capability, and nothing in it should be read as an official product, endorsement or assessment.
        </p>
        <p className="muted">
          The scenarios, characters and gameplay concepts were written for the prototype. Where the game cites the framework, the Principles page shows whether
          each item is published, summarised, or a placeholder awaiting Ben's review.
        </p>
      </section>
    </section>
  );
}
