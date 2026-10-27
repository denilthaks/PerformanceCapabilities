// Bronze, silver and gold medals, and the transparent criteria behind them.

import { MEDAL_RULES, MEDALS, medalChecks, type Medal } from '../engine/scenario-engine';
import type { Result, Scenario } from '../engine/types';

const COLORS: Record<Medal, [string, string, string]> = {
  bronze: ['#b8743c', '#7a4520', '#e3a36b'],
  silver: ['#c9ccd6', '#7d8190', '#f4f4f7'],
  gold: ['#e0b34a', '#8f6a1e', '#f3d98a'],
};

export function MedalIcon({ medal, size = 28, label }: { medal: Medal | null; size?: number; label?: string }) {
  const [base, shade, hi] = medal ? COLORS[medal] : ['#2a2434', '#18141f', '#3e3650'];
  return (
    <svg className="pixel medal-icon" width={size} height={size} viewBox="0 0 14 16" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} shapeRendering="crispEdges">
      <path d="M3 0h3v5H3z M8 0h3v5H8z" fill={medal ? '#a3122f' : '#1e1a27'} />
      <path d="M4 4h6v1H4z M3 5h8v1H3z M2 6h10v6H2z M3 12h8v1H3z M4 13h6v1H4z" fill={base} />
      <path d="M2 11h10v1H2z M3 12h8v1H3z M4 13h6v1H4z M11 6h1v5h-1z" fill={shade} />
      <path d="M4 6h2v1H4z M3 7h1v2H3z" fill={hi} />
      {medal && <path d="M6 7h2v1H6z M5 8h4v1H5z M6 9h2v2H6z" fill={shade} />}
    </svg>
  );
}

export const MEDAL_NAMES: Record<Medal, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };

/** The three medals with their criteria; ticks show which a result met. */
export function MedalCriteria({ scenario, result, best }: { scenario: Scenario; result?: Result | null; best?: Medal | null }) {
  const checks = medalChecks(scenario, result ?? null);
  return (
    <ul className="medal-criteria">
      {MEDALS.map((m, i) => {
        const met = result !== undefined ? checks[i].met : best ? MEDALS.indexOf(best) >= i : false;
        return (
          <li key={m} className={met ? 'met' : ''}>
            <MedalIcon medal={met ? m : null} size={26} />
            <span>
              <strong>{MEDAL_RULES[m].title}</strong>
              <small>{MEDAL_RULES[m].criterion}</small>
            </span>
            <span className="visually-hidden">{met ? 'Earned' : 'Not yet earned'}</span>
          </li>
        );
      })}
    </ul>
  );
}
