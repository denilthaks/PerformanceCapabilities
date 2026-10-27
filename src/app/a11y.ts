// Preferences, focus and announcement helpers shared by every screen.

import type { Settings } from '../engine/progress-store';

export function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.dataset.motion = settings.motion;
  root.dataset.textSize = settings.textSize;
}

export function prefersReducedMotion(settings: Settings): boolean {
  if (settings.motion === 'reduce') return true;
  if (settings.motion === 'full') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Polite announcements for changes that don't move focus.
export function announce(message: string) {
  const region = document.getElementById('announcer');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => { region.textContent = message; }, 50);
}

/** After a screen change, move focus to its main heading. */
export function focusMainHeading(container: HTMLElement | null) {
  const heading = container?.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    (heading as HTMLElement).focus({ preventScroll: true });
  }
}
