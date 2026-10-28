// End-to-end check for the nine-screen prototype (prototype/). Runs the
// production build in Chromium under a GitHub Pages-style sub-path, plays the
// Ground floor on desktop (keyboard + mouse) and on a phone (touch), and
// checks validation, persistence, missing assets and console errors.
//   npm run build && npm run e2e:prototype
// Screenshots go to docs/prototype/screens, results to docs/prototype/e2e.json.

const { chromium, devices } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'docs', 'prototype');
const SHOTS = path.join(OUT, 'screens');
const BASE = '/PerformanceCapabilities/';
const PORT = Number(process.env.E2E_PORT || 4323);
const URL = `http://localhost:${PORT}${BASE}prototype/`;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg' };
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (!url.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
      let file = path.join(DIST, url.slice(BASE.length));
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

const results = [];
const problems = [];
function expect(cond, msg) { if (!cond) throw new Error(msg); }
function watch(page, label) {
  const external = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u);
  page.on('pageerror', (e) => problems.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_(TUNNEL|PROXY|NAME|CONNECTION)/.test(m.text())) problems.push(`[${label}] console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !external(r.url())) problems.push(`[${label}] HTTP ${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => { if (!external(r.url())) problems.push(`[${label}] request failed ${r.url()}`); });
}
async function step(name, fn) {
  const t = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t }); console.log(`  ✓ ${name}`); }
  catch (e) { results.push({ name, ok: false, error: e.message }); console.log(`  ✗ ${name}\n    ${e.message}`); }
}
const screen = (page) => page.evaluate(() => window.__proto.screen);
const waitScreen = (page, s, timeout = 12000) => page.waitForFunction((x) => window.__proto?.screen === x, s, { timeout });
async function shot(page, name) {
  await page.waitForTimeout(300);
  await page.locator('#stage').screenshot({ path: path.join(SHOTS, `${name}.jpg`), type: 'jpeg', quality: 85 });
}
/** Click a room hotspot: a real pointer click if it's in view, otherwise the button's own click. */
async function clickHotspot(page, id) {
  const el = page.locator(`.hs[data-id="${id}"]`);
  try { await el.click({ timeout: 1500 }); } catch { await el.evaluate((b) => b.click()); }
}
/** Talk through a conversation, choosing the player's reply whenever one is offered. */
async function talkThrough(page, stopAt) {
  for (let i = 0; i < 12 && (await screen(page)) === 'talk'; i++) {
    if (stopAt && (await page.locator('.dlg p').innerText()).includes(stopAt)) return true;
    if (await page.locator('#reply').count()) await page.locator('#reply').click();
    else await page.locator('#next').click();
    await page.waitForTimeout(80);
  }
  return false;
}
async function visit(page, id, opts = {}) {
  await clickHotspot(page, id);
  const isTalk = await page.waitForFunction(() => ['talk', 'notebook'].includes(window.__proto.screen), null, { timeout: 12000 }).then(() => screen(page));
  if (isTalk === 'talk') {
    const stopped = await talkThrough(page, opts.stopAt);
    if (stopped) return 'stopped';
  } else if (!opts.stay) {
    await page.keyboard.press('Escape');
  }
  if (!opts.stay) await waitScreen(page, 'lobby');
  return isTalk;
}
async function noHorizontalScroll(page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  expect(sw <= iw, `page scrolls sideways (${sw} > ${iw})`);
}
/** The element's centre is on screen and not covered or clipped by anything else. */
async function reachable(page, sel) {
  const ok = await page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return Boolean(hit && (el === hit || el.contains(hit)));
  });
  expect(ok, `${sel} is covered or clipped`);
}
async function insideViewport(page, sel) {
  const vp = page.viewportSize();
  for (const s of sel) {
    await reachable(page, s);
    const b = await page.locator(s).first().boundingBox();
    expect(b, `${s} not rendered`);
    expect(b.x >= -1 && b.y >= -1 && b.x + b.width <= vp.width + 1 && b.y + b.height <= vp.height + 1, `${s} is outside the viewport (${JSON.stringify(b)})`);
  }
}

async function desktop(browser) {
  console.log('Desktop (1440 × 900, keyboard and mouse)');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page, 'desktop');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  await step('1 Title renders the logo and Start Journey', async () => {
    expect(await page.locator('.title .logo').count() === 1, 'no logo');
    expect(await page.locator('#start').isVisible(), 'no start button');
    expect(!(await page.locator('#continue').count()), 'Continue shown on a fresh save');
    await shot(page, 'desktop-01-title');
  });

  await step('2 Character selection: validation, keyboard choice, pass', async () => {
    await page.click('#start');
    await waitScreen(page, 'select');
    await page.click('#issue');
    expect((await page.locator('#name-err').innerText()).includes('name'), 'empty name was accepted');
    await page.locator('.look[data-look="ember"]').focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.locator('.look.sel').getAttribute('data-look') === 'onyx', 'arrow key did not change look');
    await page.keyboard.press('ArrowLeft');
    await page.fill('#name', 'Alex Rivera');
    await shot(page, 'desktop-02-select');
    await page.click('#issue');
    await waitScreen(page, 'lobby');
  });

  await step('3 Lobby: intro plays, then WASD/arrows move the player and are blocked by furniture', async () => {
    expect(await page.locator('.dlg.intro').isVisible(), 'arrival intro missing');
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(60); }
    expect(!(await page.locator('.dlg.intro').count()), 'intro did not finish');
    const run = await page.evaluate(() => window.__proto.run.stageId);
    expect(run === 'investigate', `stage is ${run}`);
    const before = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    await page.locator('#roomview').focus();
    await page.keyboard.down('a'); await page.waitForTimeout(450); await page.keyboard.up('a');
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    expect(after.x < before.x - 10, `A did not move left (${before.x} → ${after.x})`);
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(2500); await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(150);
    const up = await page.evaluate(() => window.__proto.save.pos.y);
    expect(up >= 104, `walked through the wall to y=${up}`);
    expect(await page.locator('#backdana').isDisabled(), 'Back to Dana should be locked before talking to Dana and Kai');
    await shot(page, 'desktop-03-lobby');
  });

  await step('Clicking the floor walks there (mouse)', async () => {
    const before = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    const box = await page.locator('#roomview').boundingBox();
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.85);
    await page.waitForTimeout(2200);
    const after = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    expect(Math.hypot(after.x - before.x, after.y - before.y) > 10, 'click-to-walk did not move the player');
  });

  await step('4 NPC dialogue: Margit, then Kai reacts to what you learned', async () => {
    await visit(page, 'margit');
    expect(await page.evaluate(() => window.__proto.run.inspected.includes('margit')), 'Margit not recorded');
    const r = await visit(page, 'kai', { stopAt: 'amber light' });
    expect(r === 'stopped', 'Kai\'s conditional line (after Margit) did not appear');
    await insideViewport(page, ['#next', '.replies .rp']);
    await shot(page, 'desktop-04-talk');
    await talkThrough(page);
    await waitScreen(page, 'lobby');
  });

  await step('E key interacts when standing next to someone', async () => {
    await clickHotspot(page, 'dana');
    await waitScreen(page, 'talk');
    await page.keyboard.press('Escape');
    await waitScreen(page, 'lobby');
    expect(await page.locator('#prompt').isVisible(), 'no interaction prompt beside Dana');
    await page.locator('#roomview').focus();
    await page.keyboard.press('e');
    await waitScreen(page, 'talk');
    await talkThrough(page);
    await waitScreen(page, 'lobby');
  });

  await step('5 Evidence: notebook tracks clues and unlocks replies', async () => {
    for (const id of ['luis', 'ines', 'training-record', 'gate-log']) await visit(page, id);
    await visit(page, 'gate-console', { stay: true });
    await waitScreen(page, 'notebook');
    const count = await page.locator('.nb .count').innerText();
    expect(count.replace(/\s/g, '') === '8/9', `notebook count ${count}`);
    expect(await page.locator('.unlock').isVisible(), 'East gate should unlock a reply');
    await insideViewport(page, ['.unlock', '.notebook .xbtn']);
    await shot(page, 'desktop-05-notebook');
    await page.keyboard.press('Escape');
    await waitScreen(page, 'lobby');
    await visit(page, 'binder');
    await visit(page, 'emblem'); // the founder's memo: a secret with no marker
    expect(await page.evaluate(() => window.__proto.run.inspected.length) === 10, 'not every source recorded');
    await page.keyboard.press('n');
    await waitScreen(page, 'notebook');
    expect((await page.locator('.nb .count').innerText()).replace(/\s/g, '') === '9/9', 'notebook not 9/9');
    expect(await page.locator('.clue.memo').count() === 1, 'founder\'s memo not listed');
    await page.keyboard.press('Escape');
    await waitScreen(page, 'lobby');
  });

  await step('6 Transition into the 2D decision view', async () => {
    expect(!(await page.locator('#backdana').isDisabled()), 'Back to Dana still locked');
    await page.click('#backdana');
    await waitScreen(page, 'transition');
    await page.waitForTimeout(2000);
    expect((await page.locator('.ob.done').count()) >= 3, 'objectives not ticked');
    await insideViewport(page, ['#enter']);
    await shot(page, 'desktop-06-transition');
    await page.click('#enter');
    await waitScreen(page, 'decision');
  });

  await step('7 Decision: answer is required; keys pick options', async () => {
    expect(await page.locator('.opt').count() === 4, 'all four options should be open after full investigation');
    await page.click('#sayit');
    expect((await page.locator('.q .formerr').innerText()).includes('Choose'), 'no validation message');
    await page.keyboard.press('3');
    expect((await page.locator('.opt.sel .ot').innerText()).includes('nobody has ever shown him'), 'key 3 did not pick option C');
    await insideViewport(page, ['#sayit', '.opt.sel']);
    await shot(page, 'desktop-07-decision');
    await page.click('#sayit');
    await waitScreen(page, 'feedback');
  });

  await step('8 Feedback shows outcome, reactions and learning', async () => {
    expect((await page.locator('.fb h3').innerText()).includes('The pattern fits'), 'wrong headline');
    expect(await page.locator('.feedback.q-strong').count() === 1, 'not rated strong');
    expect((await page.locator('.react').count()) === 2, 'reactions missing');
    await insideViewport(page, ['#continue']);
    await shot(page, 'desktop-08-feedback');
    await page.click('#continue');
    await waitScreen(page, 'decision');
    await page.locator('.opt', { hasText: 'two shifts with Margit' }).click();
    await page.click('#sayit');
    await waitScreen(page, 'feedback');
    expect((await page.locator('.fb h3').innerText()).includes('A slower week'), 'second outcome wrong');
    await page.click('#continue');
    await waitScreen(page, 'reflection');
  });

  await step('Reflection requires at least one line', async () => {
    await page.click('#finish');
    expect((await page.locator('.refl .formerr').innerText()).includes('Tick'), 'empty reflection accepted');
    await page.locator('.chk', { hasText: 'where and when' }).click();
    await page.fill('textarea[name=note]', 'Someone who passed the course but never practised.');
    await page.click('#finish');
    await waitScreen(page, 'complete');
  });

  let xp = 0;
  await step('9 Floor complete: gold medal, XP, progress', async () => {
    expect((await page.locator('.goldt').innerText()).startsWith('Gold'), `medal is ${await page.locator('.goldt').innerText()}`);
    xp = Number((await page.locator('.rwd b').first().innerText()).replace(/\D/g, ''));
    // 30 completion + 50 evidence (capped) + 15 reflection + 50 reasoning at 100%.
    expect(xp === 145, `XP is ${xp}, expected 145`);
    expect(await page.locator('.fl.open').innerText().then((t) => t.includes('Data Vault')), 'Floor 7 not shown as open');
    await insideViewport(page, ['#elevator', '#replay']);
    await shot(page, 'desktop-09-complete');
  });

  await step('Persistence: best result and position survive a reload', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await waitScreen(page, 'title');
    expect(await page.locator('#continue').isVisible(), 'Continue missing after reload');
    expect((await page.locator('.bestline').innerText()).includes('Gold'), 'best medal not saved');
    await page.click('#continue');
    await waitScreen(page, 'complete');
    const saved = await page.evaluate(() => window.__proto.save.best);
    expect(saved.xp === xp && saved.medal === 'gold' && saved.completions === 1, `best ${JSON.stringify(saved)}`);
  });

  await step('Replay keeps the best and starts a fresh run', async () => {
    await page.click('#replay');
    await waitScreen(page, 'lobby');
    const s = await page.evaluate(() => window.__proto.save);
    expect(s.run.inspected.length === 0 && s.best.medal === 'gold', 'replay did not reset correctly');
  });

  await step('Mid-run save resumes in the lobby with clues kept', async () => {
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(60); }
    await visit(page, 'dana');
    await page.reload({ waitUntil: 'networkidle' });
    await page.click('#continue');
    await waitScreen(page, 'lobby');
    const s = await page.evaluate(() => window.__proto.run);
    expect(s.inspected.includes('dana') && s.stageId === 'investigate', `resumed run ${JSON.stringify(s)}`);
  });

  await step('A corrupted save is ignored safely', async () => {
    await page.evaluate(() => localStorage.setItem('pc-journey.prototype.v1', '{"v":1,"player":{"name":"<img src=x onerror=alert(1)>","look":"hacker"},"run":{"stageId":"nope"}}'));
    await page.reload({ waitUntil: 'networkidle' });
    expect(!(await page.locator('#continue').count()), 'an invalid player was accepted');
    await page.evaluate(() => localStorage.setItem('pc-journey.prototype.v1', 'not json'));
    await page.reload({ waitUntil: 'networkidle' });
    await waitScreen(page, 'title');
  });

  await step('The main game save is untouched', async () => {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(!keys.includes('pc-journey.progress'), `prototype wrote to the main game's key: ${keys}`);
  });

  await ctx.close();
}

async function mobile(browser) {
  console.log('Phone (390 × 844, touch)');
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  watch(page, 'mobile');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const m = (n) => `mobile-${n}`;

  await step('Mobile title fits the screen', async () => {
    await noHorizontalScroll(page);
    await insideViewport(page, ['.title .logo', '#start', '.loopbar']);
    await shot(page, m('01-title'));
  });
  await step('Mobile selection by tap', async () => {
    await page.tap('#start');
    await waitScreen(page, 'select');
    await page.tap('.look[data-look="vanta"]');
    await page.fill('#name', 'Sam');
    await insideViewport(page, ['.look[data-look="signal"]', '#issue', '#name']);
    const cards = await page.locator('.looks').boundingBox();
    const pass = await page.locator('.pass').boundingBox();
    expect(cards.y + cards.height <= pass.y, 'look cards overlap the staff pass');
    await shot(page, m('02-select'));
    await page.tap('#issue');
    await waitScreen(page, 'lobby');
  });
  await step('Mobile lobby: tap to walk, d-pad, E button', async () => {
    for (let i = 0; i < 3; i++) await page.tap('#next');
    await insideViewport(page, ['.dpad .u', '#backdana', '#nbbtn']);
    const before = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    const box = await page.locator('#roomview').boundingBox();
    await page.tap('#roomview', { position: { x: box.width * 0.2, y: box.height * 0.8 } }).catch(async () => page.touchscreen.tap(box.x + box.width * 0.2, box.y + box.height * 0.8));
    await page.waitForTimeout(2200);
    const mid = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    expect(Math.hypot(mid.x - before.x, mid.y - before.y) > 10, 'tap-to-walk did not move');
    const pad = await page.locator('.dpad .r').boundingBox();
    await page.dispatchEvent('.dpad .r', 'pointerdown', { button: 0, pointerType: 'touch' });
    await page.waitForTimeout(500);
    await page.dispatchEvent('.dpad .r', 'pointerup', { pointerType: 'touch' });
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => ({ ...window.__proto.save.pos }));
    expect(after.x > mid.x + 10 && pad, 'd-pad did not move right');
    await shot(page, m('03-lobby'));
  });
  await step('Mobile dialogue, notebook, decision, feedback and completion', async () => {
    await visit(page, 'margit');
    const r = await visit(page, 'kai', { stopAt: 'amber light' });
    expect(r === 'stopped', 'Kai line missing');
    await insideViewport(page, ['.dlg', '.replies']);
    await shot(page, m('04-talk'));
    await talkThrough(page);
    await waitScreen(page, 'lobby');
    for (const id of ['dana', 'luis', 'ines', 'training-record', 'gate-log']) await visit(page, id);
    await visit(page, 'gate-console', { stay: true });
    await waitScreen(page, 'notebook');
    await insideViewport(page, ['.nb', '.doc']);
    await shot(page, m('05-notebook'));
    await page.tap('.notebook .xbtn');
    await waitScreen(page, 'lobby');
    await visit(page, 'binder');
    await page.tap('#backdana');
    await waitScreen(page, 'transition');
    await page.waitForTimeout(2000);
    await insideViewport(page, ['.flat', '#enter']);
    await shot(page, m('06-transition'));
    await page.tap('#enter');
    await waitScreen(page, 'decision');
    await page.locator('.opt', { hasText: 'nobody has ever shown him' }).tap();
    await insideViewport(page, ['#sayit']);
    await shot(page, m('07-decision'));
    await page.tap('#sayit');
    await waitScreen(page, 'feedback');
    await insideViewport(page, ['#continue']);
    await shot(page, m('08-feedback'));
    await page.tap('#continue');
    await waitScreen(page, 'decision');
    await page.locator('.opt', { hasText: 'two shifts with Margit' }).tap();
    await page.tap('#sayit');
    await waitScreen(page, 'feedback');
    await page.tap('#continue');
    await waitScreen(page, 'reflection');
    await page.locator('.chk').first().tap();
    await page.tap('#finish');
    await waitScreen(page, 'complete');
    await insideViewport(page, ['#elevator', '.rewards']);
    await noHorizontalScroll(page);
    await shot(page, m('09-complete'));
  });
  await ctx.close();
}

async function smallPhone(browser) {
  console.log('Small phone (iPhone SE, 320 × 568)');
  const ctx = await browser.newContext({ ...devices['iPhone SE'] });
  const page = await ctx.newPage();
  watch(page, 'small phone');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await step('Small phone: title, selection and lobby fit without sideways scrolling', async () => {
    await noHorizontalScroll(page);
    await insideViewport(page, ['#start', '.loopbar']);
    await page.tap('#start');
    await waitScreen(page, 'select');
    const cards = await page.locator('.looks').boundingBox();
    const pass = await page.locator('.pass').boundingBox();
    expect(cards.y + cards.height <= pass.y, 'look cards overlap the staff pass');
    await insideViewport(page, ['#issue', '#name']);
    await page.fill('#name', 'Jo');
    await page.tap('#issue');
    await waitScreen(page, 'lobby');
    await insideViewport(page, ['#next']);
    for (let i = 0; i < 3; i++) await page.tap('#next');
    await insideViewport(page, ['#backdana', '.dpad .d', '#nbbtn']);
    await noHorizontalScroll(page);
  });
  await ctx.close();
}

async function mainGame(browser) {
  console.log('Main game (regression)');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  watch(page, 'main game');
  await step('The existing game still loads at the site root', async () => {
    await page.goto(`http://localhost:${PORT}${BASE}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#root *', { timeout: 8000 });
    expect((await page.title()).includes('Performance Capability'), 'main page title changed');
  });
  await ctx.close();
}

const STAGES = ['title', 'select', 'lobby', 'talk', 'notebook', 'transition', 'decision', 'feedback', 'complete'];
/** Side-by-side sheets: the approved concept panels next to this run's screenshots. */
async function comparisons(browser) {
  const img = (p) => `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 } });
  const css = '<style>body{margin:0;background:#050407;font:600 15px Inter,sans-serif;color:#ff6b75}section{padding:12px 16px}h2{font-size:15px;margin:0 0 8px}.row{display:flex;gap:16px}.row img{width:614px;border-radius:8px}.m{display:flex;gap:12px;padding:16px}.m img{width:180px;border-radius:6px}</style>';
  const rows = STAGES.map((n, i) => `<section><h2>0${i + 1} ${n}: approved concept (left), built prototype (right)</h2><div class="row"><img src="${img(path.join(OUT, 'concept', `concept-0${i + 1}.jpg`))}"><img src="${img(path.join(SHOTS, `desktop-0${i + 1}-${n}.jpg`))}"></div></section>`).join('');
  await page.setContent(`${css}${rows}`);
  await page.screenshot({ path: path.join(OUT, 'comparison.jpg'), fullPage: true, type: 'jpeg', quality: 82 });
  await page.setViewportSize({ width: 1900, height: 400 });
  await page.setContent(`${css}<div class="m">${STAGES.map((n, i) => `<img src="${img(path.join(SHOTS, `mobile-0${i + 1}-${n}.jpg`))}">`).join('')}</div>`);
  await page.screenshot({ path: path.join(OUT, 'mobile-strip.jpg'), fullPage: true, type: 'jpeg', quality: 82 });
  await page.close();
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch();
  try {
    await desktop(browser);
    await mobile(browser);
    await smallPhone(browser);
    await mainGame(browser);
    await comparisons(browser);
  } finally {
    await browser.close();
    server.close();
  }
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(OUT, 'e2e.json'), JSON.stringify({ at: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results, problems }, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (problems.length) console.log(`Console errors / missing assets:\n  ${problems.join('\n  ')}`);
  else console.log('No console errors, page errors or missing assets.');
  process.exit(failed.length || problems.length ? 1 : 0);
})();
