# Nine-screen prototype

A playable vertical slice of the Ground floor (**The Front Gate**), built to the approved concept board in [`docs/prototype/concept/concept-board.jpg`](../docs/prototype/concept/concept-board.jpg). It runs as its own page at `prototype/` and leaves the main game untouched.

```sh
npm ci
npm run dev                 # http://localhost:5173/prototype/
npm run build               # builds the game and the prototype into dist/  (dist/prototype/)
npm run build:standalone    # one self-contained file: dist-standalone/prototype-standalone.html
npm run preview             # serves dist/ at http://localhost:4173/  (prototype at /prototype/)
npm test                    # unit tests, including the prototype's save rules
npm run e2e:prototype       # after a build: plays it in Chromium (desktop, phone, small phone),
                            # saves screenshots and the comparison sheets in docs/prototype/
```

The end-to-end check needs Playwright with Chromium (`npm install --no-save playwright && npx playwright install chromium`). It can also test an unpacked download:

```sh
E2E_DIST=path/to/site E2E_OUT=/tmp/pc-e2e npm run e2e:prototype                          # a built site folder
E2E_URL=file:///path/to/prototype-standalone.html E2E_OUT=/tmp/pc-e2e npm run e2e:prototype  # the single file
```

The single-file build opens straight from disk with a double-click. Browsers block module scripts on `file://`, so `dist/prototype/index.html` needs a local server instead. In the single file, "Full game" links to the GitHub repository, because there is no game beside it.

Once merged to `main`, GitHub Pages serves it at `<site>/prototype/`. Nothing deploys from this branch.

## What's real and what's not

The prototype is plain HTML, CSS and JavaScript (`index.html`, `style.css`, `main.js`, `state.js`). It imports the main game's source directly rather than copying it:

| Used from the repo | Source |
|---|---|
| Story, dialogue, evidence, decisions, outcomes, reflection | `src/content/scenarios/front-gate.ts` |
| Characters, roles, perspectives, portraits | `src/content/characters.ts` |
| Floors, artefact, unlock order | `src/content/zones.ts` |
| Key learning titles and summaries | `src/content/principles.ts` |
| Scoring, XP, medals, unlocked replies, save checks | `src/engine/scenario-engine.ts`, `src/engine/progress-store.ts` |
| Lobby pixel art, walkable floor, furniture collision | `src/assets/rooms/lobby.svg`, `src/ui/rooms.ts` |
| Player looks (Ember, Onyx, Vanta, Signal) | `src/ui/looks.ts` (palettes), `src/ui/sprites.tsx` (sprite shapes) |
| Logo geometry, colours and type | `src/ui/BrandLogo.tsx` (redrawn as the same SVG) |
| Medal art | `src/ui/medals.tsx` (same pixel paths) |

**Everything is 2D.** There is no genuine 3D: no WebGL, no 3D models. Depth is *simulated*: the title screen's skyline and figure are flat layers that shift at different rates under the pointer (parallax), and the lobby uses a follow camera that zooms into the 2D room. Both are labelled on the page.

## Controls

| | Keyboard | Mouse | Touch |
|---|---|---|---|
| Walk | WASD / arrows | click the floor | tap the floor, or the d-pad |
| Talk / examine | E, Enter or Space beside someone | click them | tap them, or the E button |
| Notebook | N (Esc closes) | notebook button | notebook button |
| Dialogue | Enter / Space for next | Next / reply buttons | same |
| Answer | 1–4 or A–D, arrows; Enter submits | click, then **Say it** | tap, then **Say it** |

## Saved progress

Saved in `localStorage` under `pc-journey.prototype.v1`, separate from the main game's `pc-journey.progress`. Everything read back is re-validated against the scenario (`state.js`, tested in `tests/prototype-state.test.ts`). It keeps your pass, the current run, your position in the lobby, and your best medal and XP. **Continue** resumes on the right screen; **Play it differently** starts a new run and keeps your best.

## Fidelity to the concept board

Compared side by side in [`docs/prototype/comparison.jpg`](../docs/prototype/comparison.jpg) (concept left, build right) and on phones in [`docs/prototype/mobile-strip.jpg`](../docs/prototype/mobile-strip.jpg). The comparison is visual; no pixel diff was run, so this is **not** a claim of pixel-perfect fidelity.

**Matches:** the black and crimson palette, the logo, fonts (Sora, Inter, Pixelify Sans, Libre Caslon Text), glowing red borders and cards, and the layout of all nine screens: positions, proportions, buttons and HUD.

**Differs, on purpose, to use real content:**
- **Talk (4):** the concept's four reply prompts were placeholders. The Front Gate script has linear conversations, so the reply list offers the player's real line when the script has one, plus *Leave for now*.
- **Notebook (5):** the concept drew the East gate log as bar charts. The build shows the record's own lines, verbatim.
- **Decision (7):** Dana's speech bubble is her real `perspective` line. Replies you haven't unlocked are hidden behind *"There may be another answer"*, as in the main game. Here, option D is tagged as unlocked by the binder.
- **Feedback (8):** key learning uses the real principles this choice links to (Level 1: Transactional; You Can't Develop What You Don't Accept; Knowing is not yet doing). Only each summary's first sentence is shown. The outcome narrative sits above the reactions.
- **Complete (9):** a full run shows **+145 XP**, not the concept's +140. The engine also counts the founder's memo as an inspected source (evidence XP is capped at 50). Without the memo it is 140.
- **Transition (6):** *Skip intro* became *Keep looking*. The objectives are computed from the run.
- **Extra screen:** the scenario requires a notebook reflection before the floor completes, so there is a tenth screen between feedback and completion.

**Not done yet:**
- Only the Ground floor. *Take the elevator to 7* opens the main game.
- No sound, voice-over or voice typing (the main game has all three). The concept's mic button on the pass is not built.
- Tested in Chromium only (desktop 1440×900, emulated iPhone 13 and iPhone SE). Not tested in Safari or Firefox, or on real devices.
- Keyboard and touch are fully playable, but there's been no screen-reader audit.
