// Persistent navigation. Desktop: inline links plus the Continue Journey
// action. Mobile: compact brand mark, a Continue button and a menu drawer.

import { useEffect, useRef, useState } from 'react';
import { useGame } from '../app/game';
import { continuePath } from '../engine/progression';
import { ZONES } from '../content/zones';
import { Icon, Link } from './common';

const LINKS = [
  { section: 'home', to: '/', label: 'Home' },
  { section: 'journey', to: '/journey', label: 'The Journey' },
  { section: 'zones', to: '/zones', label: 'Zones' },
  { section: 'principles', to: '/principles', label: 'Principles' },
  { section: 'about', to: '/about', label: 'About Ben' },
  { section: 'progress', to: '/progress', label: 'My Progress' },
  { section: 'settings', to: '/settings', label: 'Profile & Settings' },
];

export function NavBar({ section }: { section: string }) {
  const { progress } = useGame();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const cont = continuePath(progress, ZONES);
  const continueLabel = progress.player ? 'Continue Journey' : 'Begin Journey';

  // Close the drawer on navigation and with Escape; keep focus sensible.
  useEffect(() => { setOpen(false); }, [section]);
  useEffect(() => {
    if (!open) return;
    drawer.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Performance Capability: The Journey, home">
          <span className="brand-plate"><img src="./brand/performance-capability-mark.png" alt="" width="34" height="34" /></span>
          <span className="brand-text">
            <span className="brand-name">Performance Capability</span>
            <span className="brand-sub">The Journey · prototype</span>
          </span>
        </Link>
        <nav aria-label="Main" className="nav-links">
          <ul>
            {LINKS.map((l) => (
              <li key={l.section}>
                <Link to={l.to} className={section === l.section ? 'active' : undefined} aria-current={section === l.section ? 'page' : undefined}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link to={cont} className="btn btn-primary nav-cta">{continueLabel}<Icon name="arrow" size={18} /></Link>
        <button
          ref={toggle}
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-drawer"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} size={24} />
          <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>
      <div id="nav-drawer" ref={drawer} className={`nav-drawer${open ? ' open' : ''}`} hidden={!open}>
        <nav aria-label="Main (mobile)">
          <ul>
            {LINKS.map((l) => (
              <li key={l.section}>
                <Link to={l.to} className={section === l.section ? 'active' : undefined} aria-current={section === l.section ? 'page' : undefined}>{l.label}</Link>
              </li>
            ))}
          </ul>
          <Link to={cont} className="btn btn-primary btn-block">{continueLabel}<Icon name="arrow" size={18} /></Link>
        </nav>
      </div>
    </header>
  );
}
