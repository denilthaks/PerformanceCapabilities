# Phase A: research, audit and plan

## 1. Repository audit (before any change)

| Area | Found |
|---|---|
| `denilthaks/PerformanceCapabilities` | Empty apart from a one-line `README.md` and one initial commit. No framework, entry point, dependencies, assets or state management to preserve. |
| `denilthaks/CURIO` (CurioTrail) | React 18 + TypeScript + Vite + Three.js. Pure-TS engine (`src/engine`), versioned and sanitised localStorage store, hash router, a11y helpers, lazy-loaded 3D world with a 2D fallback, Vitest unit tests, a Playwright e2e script, and GitHub Actions for tests and Pages. |
| CurioTrail verification | Not taken on trust: cloned and run. `npm ci`, `npx tsc --noEmit` (clean) and `npx vitest run` (**99 / 99 passing**). |

### What was reused from CurioTrail, and what wasn't

CurioTrail was used as a technical reference, not a template.

- **Patterns reused** (rewritten for this game, not copied wholesale):
  - pure engine functions, with the UI kept separate
  - localStorage store that treats saved data as untrusted, then validates and clamps it
  - "best score is kept" replay rule
  - hash routing, so the build works on any static host
  - focus and announcement helpers
  - WebGL capability check before downloading Three.js
  - Vite relative base
  - CI workflows and the e2e harness approach
- **Not reused:**
  - its quest and challenge engine (SQL, Python, Excel and KPI specific)
  - its Viking island model and fantasy art
  - its teal and parchment palette

## 2. Source research

The official sites (`performancecapability.com`, `performancecapability.shop`) and the podcast host couldn't be fetched from the build environment: its network policy rejected those hosts (HTTP 403 at the proxy). Research therefore relied on search-engine extracts of those official pages. **Every framework claim in the game is labelled with how it was verified**, and nothing that couldn't be verified was written as fact.

| Claim used in the game | Status | Where found |
|---|---|---|
| Ben Benson is the founder of Performance Capability, which operates performancecapability.com | Summarised | Privacy policy and Founder's Note (official site) |
| Founder's Note frames Performance Capability as a movement, a philosophy and a new model of effectiveness | Summarised | Founder's Note |
| The framework is the "Performance Capability Trisphereon": three interconnected levels that build sequentially, with four principles each (twelve in all) | Summarised | Trisphereon page; benson-speaks.com "The 12 Principles…" |
| Level 1 is Transactional, "Mastering the Content", the "what and how" of performance | Title verified | Podcast episode 7 title and description |
| Level 1 podcast material distinguishes knowledge-based from practice-based development | Summarised | Podcast episode 9 title |
| Site subtitles "Mastering the Context" and "Mastering the Contribution" | Summarised; the mapping to Levels 2 and 3 needs confirming | Trisphereon page extracts (the search extracts were inconsistent about labels) |
| Principle 1: "You Can't Develop What You Don't Accept", about accepting present reality | Title verified, summary summarised | Trisphereon page extracts |
| Principles 2–4: comfort with discomfort; Zone of Direct Development; process discipline | Themes summarised; official titles not confirmed | Trisphereon page extracts |
| Principles 5–12 | **Placeholder** | Not retrievable |
| Seven Stars: seven human needs that drive accomplishment; a Seven Stars assessment maps capability position against all seven | Summarised | Founder's Note, coaching page and shop extracts |
| Names of the seven needs | **Placeholder**. Deliberately not named or scored in the game. | Not retrievable |

These were seen in search results but left out because they couldn't be confirmed:
- an association between "Principle 8" and a LinkedIn post title
- claims about coaching sports teams
- a book attributed to other authors

## 3. Implementation plan (as built)

1. **Visual foundation:** design tokens from the brief's palette, glass panels, persistent responsive navigation (desktop links plus a mobile drawer), and a world map.
2. **Vertical slice:** Zone 1, *The Stalled Rig*. A data-driven scenario engine handles:
   - narrative and dialogue
   - exploration hotspots with evidence and player movement
   - two decisions (diagnosis, then response)
   - consequences with character reactions and simulated meters
   - feedback linked to labelled framework references
   - a reflection
   - a debrief scored against a transparent rubric
   - replay
3. **Zones 2–4,** built with the same engine:
   - The Shift: a first call on incomplete information, the aftermath, new evidence, then a revised decision.
   - The Horizon: a review of earlier decisions, a cross-team strategy with delayed system effects, then a person-level decision.
   - The Integration Trial: a three-phase crisis whose cast and evidence depend on earlier decisions, ending in a journey-wide debrief.
4. **Persistence and feedback:** versioned and sanitised localStorage, XP (best run kept), insight fragments, evidence records, emblems and artefacts, achievements for learning behaviours, a learning journal, and reset with confirmation.
5. **Quality assurance:** unit tests for the engine, content validation and persistence. An e2e script runs in real Chromium at desktop size, phone size and without WebGL.
