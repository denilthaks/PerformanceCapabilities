// End-to-end browser test. Runs the *production build* in real Chromium,
// served under a sub-path like GitHub Pages. Usage:
//   npm run build && npm run e2e
// Requires Playwright with Chromium. Writes screenshots to docs/screenshots
// and results to docs/test-results/e2e.json.

const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');
const RESULTS = path.join(ROOT, 'docs', 'test-results');
const BASE = '/PerformanceCapabilities/';
const PORT = Number(process.env.E2E_PORT || 4322);
const URL_BASE = `http://localhost:${PORT}${BASE}`;
const LAUNCH = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };

// Strong option ids, used to play the "best" path. Anything else picks the last option.
const STRONG = ['practice-gap', 'paired-practice', 'probe', 'redesign', 'shared-measure', 'conditions', 'guided', 'correct-record', 'recovery-plan'];
const ROUTES = ['/', '/journey', '/zones', '/zone/foundation', '/principles', '/about', '/progress', '/settings', '/create'];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (!url.startsWith(BASE)) { res.writeHead(404); res.end('Not found'); return; }
      let file = path.join(DIST, url.slice(BASE.length));
      if (url === BASE || file.endsWith(path.sep)) file = path.join(DIST, 'index.html');
      if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

const results = [];
const consoleErrors = [];
function expect(cond, msg) { if (!cond) throw new Error(msg); }
function watch(page, label) {
  page.on('pageerror', (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    // Google Fonts is blocked in some sandboxes; that's not an app error.
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_(TUNNEL|PROXY|NAME|CONNECTION)/.test(m.text())) consoleErrors.push(`[${label}] console: ${m.text()}`);
  });
}
async function shot(page, name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(SHOTS, `${name}.jpg`), type: 'jpeg', quality: 78 });
}
async function go(page, route) {
  await page.goto(`${URL_BASE}#${route}`);
  await page.waitForSelector('h1');
}
async function noOverflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(o <= 1, `${label}: horizontal overflow of ${o}px`);
}

/** Play the scenario currently open until its debrief. */
async function playScenario(page, { strong = true, shots = null } = {}) {
  for (let guard = 0; guard < 60; guard++) {
    if (page.url().includes('/debrief/')) return;
    await page.waitForTimeout(120);
    const showAll = page.locator('.dialogue button:has-text("Show all")');
    if (await page.locator('.explore').count()) {
      const pois = page.locator('.poi');
      const n = await pois.count();
      for (let i = 0; i < n; i++) {
        await pois.nth(i).click();
        if (await showAll.count()) await showAll.first().click();
      }
      if (shots) await shot(page, `${shots}-explore`);
      await page.click('.play-foot button');
      continue;
    }
    if (await showAll.count()) { await showAll.first().click(); continue; }
    if (await page.locator('.decision .options').count()) {
      const values = await page.locator('.options input').evaluateAll((els) => els.map((e) => e.value));
      const pick = strong ? values.find((v) => STRONG.includes(v)) : values[values.length - 1];
      await page.check(`.options input[value="${pick}"]`);
      if (shots) await shot(page, `${shots}-decision`);
      await page.click('button:has-text("Commit decision")');
      await page.waitForSelector('.consequence');
      if (shots) await shot(page, `${shots}-consequence`);
      continue;
    }
    if (await page.locator('.reflection').count()) {
      const boxes = page.locator('.reflection input[type=checkbox]');
      if (!(await boxes.first().isChecked())) await boxes.first().check();
      await page.fill('#reflection-note', 'They knew the steps but had never practised them on the new equipment.');
      if (shots) await shot(page, `${shots}-reflection`);
    }
    const next = page.locator('.play-foot button');
    if (await next.count()) {
      expect(await next.isEnabled(), `Continue disabled on stage "${await page.textContent('#stage-title')}": ${await page.textContent('.play-status')}`);
      await next.click();
    }
  }
  throw new Error('Scenario did not finish');
}

const checks = [
  ['home', 'Home loads with title, CTA and the 3D ambient world (or its fallback)', async (page) => {
    await go(page, '/');
    expect((await page.textContent('h1')).includes('Discover how you perform'), 'hero heading');
    await page.waitForFunction(() => ['running', 'fallback', 'off'].includes(document.querySelector('[data-ambient]')?.dataset.ambient), null, { timeout: 20000 });
    const ambient = await page.getAttribute('[data-ambient]', 'data-ambient');
    expect(ambient === 'running', `ambient status ${ambient}`);
    await page.waitForTimeout(800);
    await shot(page, '01-home');
  }],
  ['nav-links', 'Every navigation link leads to a working screen with an active state', async (page) => {
    await go(page, '/');
    const links = await page.locator('.nav-links a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(links.length === 7, `expected 7 nav links, got ${links.length}`);
    for (const href of links) {
      await page.click(`.nav-links a[href="${href}"]`);
      await page.waitForSelector(`.nav-links a.active[href="${href}"]`, { timeout: 5000 }).catch(() => {});
      const active = await page.locator('.nav-links a.active').getAttribute('href');
      expect(active === href, `active state for ${href} was ${active}`);
      expect(!(await page.textContent('h1')).includes('not found'), `${href} not found`);
    }
    for (const r of ROUTES) { await go(page, r); expect(!(await page.textContent('h1')).toLowerCase().includes('not found'), `${r} not found`); }
    await go(page, '/nowhere');
    expect((await page.textContent('h1')).includes('not found'), 'unknown route shows not found');
  }],
  ['locked', 'Zones are locked before a character exists, and play is refused', async (page) => {
    await go(page, '/journey');
    expect(await page.locator('.map-node').count() === 4, 'four zones on map');
    expect(await page.locator('.map-node.state-locked').count() === 4, 'all locked');
    await go(page, '/play/stalled-rig');
    expect((await page.textContent('h1')).includes('locked'), 'play refused');
  }],
  ['create', 'Character creation validates and saves', async (page) => {
    await go(page, '/');
    await page.click('.home-actions .btn-primary');
    await page.waitForSelector('#char-name');
    await page.click('button[type=submit]');
    expect(await page.locator('#char-name-error').count() === 1, 'empty name error');
    await shot(page, '02-create');
    await page.fill('#char-name', 'Ada');
    await page.click('.avatar-option:nth-child(2)');
    await page.click('button[type=submit]');
    await page.waitForSelector('.world-map');
    expect(await page.locator('.map-node.state-open').count() === 1, 'zone 1 open');
    expect(await page.locator('.map-node.state-locked').count() === 3, 'zones 2–4 locked');
    await page.waitForSelector('.toast');
    await shot(page, '03-map');
  }],
  ['zone1', 'Zone 1: full playable scenario with consequences, feedback and debrief', async (page) => {
    await go(page, '/zone/foundation');
    await shot(page, '04-zone-overview');
    await page.click('a:has-text("Start scenario")');
    await page.waitForSelector('.dialogue');
    await shot(page, '05-narrative');
    await page.click('.dialogue button:has-text("Show all")');
    await page.click('.play-foot button');
    await page.waitForSelector('.explore');
    expect(await page.locator('.play-foot button').isDisabled(), 'cannot leave explore before required hotspots');
    // Inspect via the scene hotspot itself (not the list) to exercise movement.
    await page.click('.hotspot[aria-label^="Kai Mensah"]');
    await page.waitForSelector('.inspect-panel .dialogue');
    await shot(page, '06-explore-dialogue');
    await page.click('.hotspot[aria-label^="Error log"]');
    await page.waitForSelector('.doc');
    await shot(page, '07-explore-evidence');
    // Back action and resume mid-scenario after a refresh.
    await page.reload();
    await page.waitForSelector('.explore');
    expect((await page.textContent('.evidence-count')).includes('2'), 'evidence survived refresh');
    await page.click('.play-nav button:has-text("Back")');
    await page.waitForSelector('.dialogue');
    await page.click('.dialogue button:has-text("Show all")');
    await page.click('.play-foot button');
    await page.waitForSelector('.explore');
    await playScenario(page, { strong: true, shots: '08-z1' });
    await page.waitForSelector('.big-score');
    expect((await page.textContent('.big-score')).includes('100'), `best path should score 100, got ${await page.textContent('.big-score')}`);
    await shot(page, '09-debrief');
    await page.click('details summary');
    expect(await page.locator('.paths li').count() >= 3, 'paths not taken listed');
  }],
  ['persist', 'Progress persists across refresh; Zone 2 unlocks; replay works and keeps best', async (page) => {
    await page.reload();
    await go(page, '/journey');
    expect(await page.locator('.map-node.state-complete').count() === 1, 'zone 1 complete after reload');
    expect(await page.locator('.map-node.state-open').count() === 1, 'zone 2 open');
    await go(page, '/debrief/stalled-rig');
    await page.click('button:has-text("Replay with a different approach")');
    await page.waitForSelector('.play');
    await playScenario(page, { strong: false });
    await page.waitForSelector('.big-score');
    const s = await page.textContent('.big-score');
    expect(!s.includes('100'), 'weak replay scores lower');
    expect((await page.textContent('.score-card')).includes('Your best: 100%'), 'best kept');
    await shot(page, '10-debrief-weak');
    // Replay the strong path so later zones see Kai as an ally.
    await page.click('button:has-text("Replay with a different approach")');
    await playScenario(page, { strong: true });
  }],
  ['zones234', 'Zones 2–4 are playable, unlock in order, and carry earlier decisions forward', async (page) => {
    for (const [zone, id, name] of [['shift', 'signal-room', '11-z2'], ['horizon', 'meridian-launch', '12-z3'], ['trial', 'crucible', '13-z4']]) {
      await go(page, `/zone/${zone}`);
      await page.click('a:has-text("Start scenario")');
      await page.waitForSelector('.play');
      await shot(page, `${name}-start`);
      if (id === 'crucible') {
        // Review stage, then the alarm: Kai should appear because Zone 1 used paired practice.
        await page.click('.play-foot button');
        await page.waitForSelector('.dialogue');
        await page.click('.dialogue button:has-text("Show all")');
        expect((await page.textContent('.dialogue')).includes('Kai Mensah'), 'carry-over line present');
      }
      await playScenario(page, { strong: true, shots: name });
      await page.waitForSelector('.big-score');
      await shot(page, `${name}-debrief`);
    }
    expect((await page.textContent('body')).includes('Your journey, across all four zones'), 'trial journey summary');
    await go(page, '/journey');
    expect(await page.locator('.map-node.state-complete').count() === 4, 'all zones complete');
    await shot(page, '14-map-complete');
  }],
  ['progress', 'Progress page shows XP, achievements, journal and evidence', async (page) => {
    await go(page, '/progress');
    const text = await page.textContent('main');
    for (const t of ['Learning journal', 'Evidence archive', 'Achievements', 'Constellation']) expect(text.includes(t), `progress shows ${t}`);
    expect(await page.locator('.achievements li.earned').count() >= 8, 'achievements earned');
    await shot(page, '15-progress');
    await go(page, '/principles');
    await shot(page, '16-principles');
    expect(await page.locator('.status-placeholder').count() >= 8, 'placeholders marked');
    await go(page, '/about');
    await shot(page, '17-about');
  }],
  ['settings', 'Settings: text size, 3D off fallback, and reset with confirmation', async (page) => {
    await go(page, '/settings');
    await page.click('.segmented label:has-text("Large")');
    expect(await page.evaluate(() => document.documentElement.dataset.textSize) === 'large', 'large text');
    await page.click('.segmented label:has-text("Off")');
    await go(page, '/');
    expect(await page.getAttribute('[data-ambient]', 'data-ambient') === 'off', '3D off');
    await go(page, '/settings');
    await page.click('.segmented label:has-text("Normal")');
    await page.click('.segmented label:has-text("Automatic")');
    await page.click('button:has-text("Reset all progress")');
    await page.waitForSelector('dialog[open]');
    await shot(page, '18-reset-confirm');
    await page.click('dialog button:has-text("Cancel")');
    expect(await page.locator('dialog[open]').count() === 0, 'cancel closes');
    await go(page, '/journey');
    expect(await page.locator('.map-node.state-complete').count() === 4, 'cancel kept progress');
    await go(page, '/settings');
    await page.click('button:has-text("Reset all progress")');
    await page.click('dialog button:has-text("Yes, reset")');
    await page.waitForSelector('.home');
    await page.reload();
    await go(page, '/journey');
    expect(await page.locator('.map-node.state-locked').count() === 4, 'reset locks everything');
  }],
];

const mobileChecks = [
  ['mobile', 'Mobile (375×740): no horizontal overflow, working menu, playable scenario', async (page) => {
    for (const r of ROUTES) { await go(page, r); await noOverflow(page, r); }
    await go(page, '/');
    await shot(page, '20-mobile-home');
    await page.click('.nav-toggle');
    await page.waitForSelector('.nav-drawer.open');
    await shot(page, '21-mobile-menu');
    await page.click('.nav-drawer a[href="#/principles"]');
    await page.waitForSelector('h1:has-text("framework")');
    expect(await page.locator('.nav-drawer.open').count() === 0, 'drawer closes after navigation');
    await go(page, '/create');
    await page.fill('#char-name', 'Sam');
    await page.click('button[type=submit]');
    await page.waitForSelector('.world-map');
    await noOverflow(page, 'map');
    await shot(page, '22-mobile-map');
    await go(page, '/play/stalled-rig');
    await page.click('.dialogue button:has-text("Show all")');
    await page.click('.play-foot button');
    await page.waitForSelector('.explore');
    await noOverflow(page, 'explore');
    await page.click('.poi >> nth=1');
    await shot(page, '23-mobile-explore');
    await playScenario(page, { strong: true, shots: '24-mobile' });
    await noOverflow(page, 'debrief');
    await shot(page, '25-mobile-debrief');
  }],
];

const noWebglChecks = [
  ['no-webgl', 'Without WebGL, the game falls back to a flat background and still works', async (page) => {
    await go(page, '/');
    await page.waitForFunction(() => document.querySelector('[data-ambient]')?.dataset.ambient === 'fallback', null, { timeout: 10000 });
    await page.click('.home-actions .btn-primary');
    await page.fill('#char-name', 'Flat');
    await page.click('button[type=submit]');
    await page.waitForSelector('.world-map');
    await shot(page, '26-no-webgl-map');
  }],
];

async function runSuite(browser, list, contextOpts, label, setup) {
  const context = await browser.newContext(contextOpts);
  if (setup) await context.addInitScript(setup);
  const page = await context.newPage();
  watch(page, label);
  for (const [id, title, fn] of list) {
    const t0 = Date.now();
    try {
      await fn(page);
      results.push({ id, title, ok: true, ms: Date.now() - t0 });
      console.log(`✓ ${id}: ${title}`);
    } catch (e) {
      results.push({ id, title, ok: false, error: e.message, ms: Date.now() - t0 });
      console.log(`✗ ${id}: ${title}\n    ${e.message}`);
      await page.screenshot({ path: path.join(SHOTS, `FAIL-${id}.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
    }
  }
  await context.close();
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(RESULTS, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch(LAUNCH);
  try {
    await runSuite(browser, checks, { viewport: { width: 1440, height: 900 } }, 'desktop');
    await runSuite(browser, mobileChecks, { viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'mobile');
    await runSuite(browser, noWebglChecks, { viewport: { width: 1280, height: 800 } }, 'no-webgl', () => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (/webgl/.test(type)) return null;
        return orig.call(this, type, ...rest);
      };
    });
  } finally {
    await browser.close();
    server.close();
  }
  const errorsCheck = { id: 'console', title: 'No console errors or uncaught exceptions', ok: consoleErrors.length === 0, error: consoleErrors.join('\n') || undefined };
  results.push(errorsCheck);
  console.log(`${errorsCheck.ok ? '✓' : '✗'} console: ${errorsCheck.title}${errorsCheck.ok ? '' : `\n${errorsCheck.error}`}`);
  fs.writeFileSync(path.join(RESULTS, 'e2e.json'), JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})();
