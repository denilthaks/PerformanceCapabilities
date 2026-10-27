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

// Strong option ids, used to play the best path. Otherwise the last open option is picked.
const STRONG = ['practice-gap', 'paired-practice', 'probe', 'redesign', 'shared-measure', 'conditions', 'guided', 'correct-record', 'recovery-plan'];
const ROUTES = ['/', '/journey', '/zones', '/zone/foundation', '/principles', '/about', '/progress', '/settings', '/create'];
const FLOORS = [['foundation', 'front-gate'], ['shift', 'signal-vault'], ['horizon', 'late-shift'], ['trial', 'top-floor']];

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
    // Google Fonts may be blocked in sandboxes; that's not an app error.
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_(TUNNEL|PROXY|NAME|CONNECTION)/.test(m.text())) consoleErrors.push(`[${label}] console: ${m.text()}`);
  });
}
async function shot(page, name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(SHOTS, `${name}.jpg`), type: 'jpeg', quality: 80 });
}
async function go(page, route) {
  await page.goto(`${URL_BASE}#${route}`);
  await page.waitForSelector('h1');
}
async function noOverflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(o <= 1, `${label}: horizontal overflow of ${o}px`);
}
async function playerPos(page) {
  return page.$eval('.player-sprite', (el) => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) }));
}
async function setMotion(page, value) {
  await go(page, '/settings');
  await page.click(`.segmented label:has-text("${value}")`);
}

/** Finish whatever dialogue is showing. */
async function skipDialogue(page) {
  const all = page.locator('.play-panel button:has-text("Skip all")');
  if (await all.count()) await all.first().click();
  const skip = page.locator('.play-panel .btn-pixel:has-text("Skip")');
  if (await skip.count()) await skip.first().click();
}

/**
 * Play the open floor to its report. thorough: examine everything (and find
 * secrets); otherwise only what's required. strong: pick strong replies.
 */
async function playFloor(page, { strong = true, thorough = true, shots = null } = {}) {
  for (let guard = 0; guard < 80; guard++) {
    if (page.url().includes('/debrief/')) return;
    await page.waitForTimeout(80);
    await skipDialogue(page);
    if (await page.locator('.explore-panel').count()) {
      const chips = page.locator('.explore-panel .chip');
      const n = await chips.count();
      for (let i = 0; i < n; i++) {
        const chip = chips.nth(i);
        const label = await chip.textContent();
        const required = !(await page.locator('.explore-foot .btn-primary').count());
        if (!thorough && !required && !/Dana|Kai|Imani|Holo|Routing|Archive|Priya|Launch|Mira|Runbook|Change|Nwosu|rota/i.test(label)) continue;
        await chip.click();
        await skipDialogue(page);
        await page.click('.play-panel button:has-text("Done")');
      }
      if (thorough) {
        const secrets = page.locator('.hotspot.secret');
        for (let i = 0; i < await secrets.count(); i++) {
          await secrets.nth(i).click();
          await page.waitForSelector('.play-panel .dialogue-box, .play-panel .doc-card', { timeout: 8000 });
          await skipDialogue(page);
          await page.click('.play-panel button:has-text("Done")');
        }
      }
      if (shots) await shot(page, `${shots}-explore`);
      await page.click('.explore-foot .btn-primary');
      continue;
    }
    if (await page.locator('.replies').count()) {
      const values = await page.locator('.replies input').evaluateAll((els) => els.map((e) => e.value));
      const pick = strong ? (values.find((v) => STRONG.includes(v)) ?? values[0]) : values[values.length - 1];
      await page.locator(`.replies input[value="${pick}"]`).check({ force: true });
      if (shots) await shot(page, `${shots}-decision`);
      await page.click('button:has-text("Say it")');
      await page.waitForSelector('.consequence');
      if (shots) await shot(page, `${shots}-consequence`);
      await page.click('.consequence-side .btn-primary');
      continue;
    }
    if (await page.locator('.notebook').count()) {
      const boxes = page.locator('.notebook input[type=checkbox]');
      if (!(await boxes.first().isChecked())) await boxes.first().check({ force: true });
      await page.fill('#reflection-note', 'They knew the steps but had never practised them on the new equipment.');
      if (shots) await shot(page, `${shots}-notebook`);
      await page.click('.notebook .btn-primary');
      continue;
    }
    const next = page.locator('.play-panel .btn-primary');
    if (await next.count()) await next.first().click();
  }
  throw new Error('Floor did not finish');
}

const checks = [
  ['home', 'Home invites the player in, over the lobby art', async (page) => {
    await go(page, '/');
    expect((await page.textContent('h1')).includes('Four floors'), 'hero heading');
    expect(await page.locator('.home-art svg').count() === 1, 'lobby art behind the hero');
    await shot(page, '01-home');
  }],
  ['nav-links', 'Every navigation link leads to a working screen with an active state', async (page) => {
    await go(page, '/');
    const links = await page.locator('.nav-links a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(links.length === 7, `expected 7 nav links, got ${links.length}`);
    for (const href of links) {
      await page.click(`.nav-links a[href="${href}"]`);
      await page.waitForSelector(`.nav-links a.active[href="${href}"]`, { timeout: 5000 }).catch(() => {});
      expect(await page.locator('.nav-links a.active').getAttribute('href') === href, `active state for ${href}`);
    }
    for (const r of ROUTES) { await go(page, r); expect(!(await page.textContent('h1')).toLowerCase().includes('not found'), `${r} not found`); }
    await go(page, '/nowhere');
    expect((await page.textContent('h1')).includes('not found'), 'unknown route shows not found');
  }],
  ['locked', 'Without a pass, every floor is locked and play is refused', async (page) => {
    await go(page, '/journey');
    expect(await page.locator('.floor').count() === 4, 'four floors');
    expect(await page.locator('.floor.state-locked').count() === 4, 'all locked');
    await go(page, '/play/front-gate');
    expect((await page.textContent('h1')).includes("won't stop"), 'play refused');
  }],
  ['create', 'Getting a pass validates the name and walks straight into the lobby', async (page) => {
    await go(page, '/');
    await page.click('.home-actions .btn-primary');
    await page.waitForSelector('#char-name');
    await page.click('button[type=submit]');
    expect(await page.locator('#char-name-error').count() === 1, 'empty name error');
    await page.fill('#char-name', 'Ada');
    await page.click('.avatar-option:nth-child(2)');
    await shot(page, '02-pass');
    await page.click('button[type=submit]');
    await page.waitForSelector('.room-stage');
    expect(page.url().includes('/play/front-gate'), 'lands in the lobby');
    await page.waitForTimeout(900);
    await shot(page, '03-first-night');
  }],
  ['lobby', 'The lobby: walking, talking, discovery-gated replies, consequences, a gold medal', async (page) => {
    await skipDialogue(page);
    await page.click('.play-panel .btn-primary');
    await page.waitForSelector('.explore-panel');
    expect(await page.locator('.explore-foot .btn-primary').count() === 0, 'cannot move on before talking to Dana and Kai');
    // Click-to-walk: the player sprite actually moves.
    const before = await playerPos(page);
    const box = await page.locator('.room-floor').boundingBox();
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.85);
    await page.waitForTimeout(1200);
    const after = await playerPos(page);
    expect(Math.abs(after.x - before.x) > 3, `click-to-walk moved the player (${before.x} → ${after.x})`);
    // Keyboard walking.
    await page.focus('.room-stage');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    const kb = await playerPos(page);
    expect(kb.x > after.x + 2, 'arrow keys move the player');
    // Walk to Kai by clicking him in the room.
    await page.click('.hotspot[aria-label^="Talk to Kai"]');
    await page.waitForSelector('.dialogue-name:has-text("Kai")', { timeout: 8000 });
    await shot(page, '04-talk-to-kai');
    await skipDialogue(page);
    await page.click('.play-panel button:has-text("Done")');
    await page.click('.chip:has-text("Dana")');
    await skipDialogue(page);
    await page.click('.play-panel button:has-text("Done")');
    // Refresh mid-floor: evidence and place survive.
    await page.reload();
    await page.waitForSelector('.explore-panel');
    expect((await page.textContent('.hud-count')).trim() === '2', 'notebook survived refresh');
    // Decide without having met Margit: the strongest read is still hidden.
    await page.click('.explore-foot .btn-primary');
    await page.waitForSelector('.replies');
    expect(await page.locator('.replies input[value="practice-gap"]').count() === 0, 'strong reply locked before discovery');
    expect(await page.locator('.reply.locked').count() === 1, 'locked replies hinted');
    await shot(page, '05-locked-reply');
    // Back to explore, find more, and it unlocks.
    await page.click('.hud-actions button:has-text("Back")');
    await page.waitForSelector('.explore-panel');
    await page.click('.chip:has-text("Margit")');
    await skipDialogue(page);
    await page.click('.play-panel button:has-text("Done")');
    await page.click('.hotspot.secret');
    await page.waitForSelector('.doc-card.secret', { timeout: 8000 });
    await shot(page, '06-secret-memo');
    await page.click('.play-panel button:has-text("Done")');
    await playFloor(page, { strong: true, thorough: true, shots: '07-lobby' });
    await page.waitForSelector('.big-medal');
    expect((await page.textContent('.big-medal')).includes('Gold'), `expected gold, got ${await page.textContent('.big-medal')}`);
    await shot(page, '08-lobby-report');
  }],
  ['replay', 'Replays keep the best medal and reveal outcomes still undiscovered', async (page) => {
    await page.reload();
    await go(page, '/debrief/front-gate');
    expect(await page.locator('.undiscovered').count() >= 1, 'undiscovered outcomes teased');
    await page.click('button:has-text("Play it differently")');
    await page.waitForSelector('.room-stage');
    await playFloor(page, { strong: false, thorough: false });
    await page.waitForSelector('.big-medal');
    expect(!(await page.textContent('.big-medal')).includes('Gold'), 'weak replay is not gold');
    expect((await page.textContent('.medal-card')).includes('still Gold'), 'best medal kept');
    await page.click('summary:has-text("Other ways")');
    await shot(page, '09-replay-report');
    // Replay the strong path so later floors see Kai as an ally.
    await page.click('button:has-text("Play it differently")');
    await playFloor(page, { strong: true, thorough: true });
  }],
  ['floors', 'Floors 2–4 unlock in order, play through, and carry earlier decisions forward', async (page) => {
    await setMotion(page, 'Reduce');
    for (const [zone, id] of FLOORS.slice(1)) {
      await go(page, `/zone/${zone}`);
      await shot(page, `10-${id}-door`);
      await page.click('a:has-text("Step out of the elevator")');
      await page.waitForSelector('.room-stage');
      if (id === 'top-floor') {
        await page.click('.play-panel .btn-primary'); // elevator ride
        await skipDialogue(page);
        await page.click('.play-panel .btn-primary');
        await page.waitForSelector('.explore-panel');
        expect(await page.locator('.chip:has-text("Desk phone")').count() === 1, 'desk phone present');
        await page.click('.chip:has-text("Desk phone")');
        await skipDialogue(page);
        expect((await page.textContent('.play-panel')).includes('Kai'), 'Kai answers because of Zone 1');
        await page.click('.play-panel button:has-text("Done")');
      }
      await playFloor(page, { strong: true, thorough: true, shots: `11-${id}` });
      await page.waitForSelector('.big-medal');
      expect((await page.textContent('.big-medal')).includes('Gold'), `${id}: gold on the best path`);
      await shot(page, `12-${id}-report`);
    }
    expect((await page.textContent('body')).includes('The whole Tower'), 'journey summary on the top floor');
    await go(page, '/journey');
    expect(await page.locator('.floor.state-complete').count() === 4, 'all floors resolved');
    await shot(page, '13-tower-complete');
    await setMotion(page, 'Match my device');
  }],
  ['progress', 'Progress shows medals, the founder\'s memos, achievements and the notebook', async (page) => {
    await go(page, '/progress');
    const text = await page.textContent('main');
    for (const t of ['Medals', "The founder's memos", 'Achievements', 'Your notebook', 'Clue archive']) expect(text.includes(t), `progress shows ${t}`);
    expect(await page.locator('.memos li.found').count() === 4, 'all four memos found');
    expect(await page.locator('.achievements li.earned').count() >= 10, 'achievements earned');
    await shot(page, '14-progress');
    await go(page, '/principles');
    expect(await page.locator('.status-placeholder').count() >= 8, 'placeholders marked');
    await shot(page, '15-principles');
    await go(page, '/about');
  }],
  ['settings', 'Settings: text size, and reset only after confirmation', async (page) => {
    await go(page, '/settings');
    await page.click('.segmented label:has-text("Large")');
    expect(await page.evaluate(() => document.documentElement.dataset.textSize) === 'large', 'large text');
    await page.click('.segmented label:has-text("Normal")');
    await page.click('button:has-text("Reset all progress")');
    await page.waitForSelector('dialog[open]');
    await page.click('dialog button:has-text("Cancel")');
    await go(page, '/journey');
    expect(await page.locator('.floor.state-complete').count() === 4, 'cancel kept progress');
    await go(page, '/settings');
    await page.click('button:has-text("Reset all progress")');
    await page.click('dialog button:has-text("Yes, reset")');
    await page.waitForSelector('.home');
    await page.reload();
    await go(page, '/journey');
    expect(await page.locator('.floor.state-locked').count() === 4, 'reset locks everything');
  }],
  ['naive', 'A player who skims (required people only, first reply offered) can finish every floor', async (page) => {
    await go(page, '/create');
    await page.fill('#char-name', 'Skimmer');
    await page.click('button[type=submit]');
    await page.waitForSelector('.room-stage');
    await setMotion(page, 'Reduce');
    for (const [, id] of FLOORS) {
      await go(page, `/play/${id}`);
      await page.waitForSelector('.room-stage');
      await playFloor(page, { strong: false, thorough: false });
      await page.waitForSelector('.big-medal');
    }
    await go(page, '/journey');
    expect(await page.locator('.floor.state-complete').count() === 4, 'skimmer resolves all floors');
  }],
];

const mobileChecks = [
  ['mobile', 'Phone (375×740): no horizontal overflow, working menu, a full floor by touch', async (page) => {
    for (const r of ROUTES) { await go(page, r); await noOverflow(page, r); }
    await go(page, '/');
    await shot(page, '20-mobile-home');
    await page.click('.nav-toggle');
    await page.waitForSelector('.nav-drawer.open');
    await page.click('.nav-drawer a[href="#/principles"]');
    await page.waitForSelector('h1:has-text("framework")');
    expect(await page.locator('.nav-drawer.open').count() === 0, 'drawer closes after navigation');
    await go(page, '/create');
    await page.fill('#char-name', 'Sam');
    await page.click('button[type=submit]');
    await page.waitForSelector('.room-stage');
    await noOverflow(page, 'lobby');
    await shot(page, '21-mobile-lobby');
    await skipDialogue(page);
    await page.click('.play-panel .btn-primary');
    await page.waitForSelector('.explore-panel');
    await page.click('.chip:has-text("Kai")');
    await shot(page, '22-mobile-talk');
    await skipDialogue(page);
    await page.click('.play-panel button:has-text("Done")');
    await playFloor(page, { strong: true, thorough: true, shots: '23-mobile' });
    await noOverflow(page, 'report');
    await shot(page, '24-mobile-report');
    await go(page, '/journey');
    await noOverflow(page, 'tower');
    await shot(page, '25-mobile-tower');
  }],
];

async function runSuite(browser, list, contextOpts, label) {
  const context = await browser.newContext(contextOpts);
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
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(RESULTS, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch();
  try {
    await runSuite(browser, checks, { viewport: { width: 1440, height: 900 } }, 'desktop');
    await runSuite(browser, mobileChecks, { viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'mobile');
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
