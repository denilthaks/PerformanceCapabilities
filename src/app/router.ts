// Hash routes work on GitHub Pages and static hosts without server rewrites.

import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'map' }
  | { name: 'zones' }
  | { name: 'zone'; id: string }
  | { name: 'play'; id: string }
  | { name: 'debrief'; id: string }
  | { name: 'principles' }
  | { name: 'about' }
  | { name: 'progress' }
  | { name: 'settings' }
  | { name: 'not-found'; path: string };

export function parseHash(hash: string): Route {
  const path = (hash || '').replace(/^#/, '') || '/';
  let m: RegExpMatchArray | null;
  if (path === '/' || path === '') return { name: 'home' };
  const simple: Record<string, Route> = {
    '/create': { name: 'create' },
    '/journey': { name: 'map' },
    '/zones': { name: 'zones' },
    '/principles': { name: 'principles' },
    '/about': { name: 'about' },
    '/progress': { name: 'progress' },
    '/settings': { name: 'settings' },
  };
  if (simple[path]) return simple[path];
  if ((m = path.match(/^\/zone\/([a-z0-9-]+)$/))) return { name: 'zone', id: m[1] };
  if ((m = path.match(/^\/play\/([a-z0-9-]+)$/))) return { name: 'play', id: m[1] };
  if ((m = path.match(/^\/debrief\/([a-z0-9-]+)$/))) return { name: 'debrief', id: m[1] };
  return { name: 'not-found', path };
}

export function navigate(path: string, { replace = false } = {}) {
  const target = `#${path}`;
  if (location.hash === target) return;
  if (replace) {
    history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = target;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const handle = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);
  return route;
}

/** The top-level nav section a route belongs to, for the active state. */
export function sectionOf(route: Route): string {
  switch (route.name) {
    case 'home': return 'home';
    case 'map': return 'journey';
    case 'zones': case 'zone': case 'play': case 'debrief': return 'zones';
    case 'principles': return 'principles';
    case 'about': return 'about';
    case 'progress': return 'progress';
    case 'settings': case 'create': return 'settings';
    default: return '';
  }
}
