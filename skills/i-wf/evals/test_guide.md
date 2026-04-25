# i-wf Eval Loop Guide

## 1. The Skill

`i-wf` orchestrates feature development through human-gated stages: Design → Code → QA → Integrate → Promote.

- Claude Code: `/i-wf <subcommand>`
- Codex: `$i-wf <subcommand>`
- Path: `skills/i-wf/`
  - `SKILL.md` — dispatcher
  - `commands/*.md` — one per subcommand (init, feature, run, advance, block, reject, status, promote, bootstrap)
  - `stages/*.md` — design, code, qa, integrate
  - `templates/*.md` — feature/INDEX/chunks/log scaffolds

## 2. The Loop (any model — Claude, GPT, etc.)

Goal: push `with_skill` pass_rate → 1.0 while delta over `without_skill` stays positive.

For each eval in `evals.json`:

1. **Spawn 2 agents in parallel** for `i-wf-workspace/iteration-N/eval-<id>-<name>/`:
   - `with_skill`: reads `SKILL.md` + relevant command/stage file, then runs the prompt
   - `without_skill`: skips skill files, uses general knowledge
2. **Both agents** create the fixture (Section 4), execute the prompt, save outputs to `outputs/`:
   - `response.txt` — text the skill prints
   - `commits.txt` — `git log --oneline`
   - `files_modified.txt` — files changed by the command
   - `index_*.md`, `log_*.md` — affected state files
   - `grading.json` — `{expectations: [{text, passed, evidence}], summary}`
3. **Aggregate** to `iteration-N/benchmark.json` with per-config means + delta.
4. **For each failing `with_skill` eval**: edit the responsible file in `skills/i-wf/`, re-run that eval only.
5. **Repeat** until all `with_skill` = 1.0.

## 3. Fixture Codes

| Code | State |
|---|---|
| A | Empty git repo, no `docs/workflow/` |
| B | `docs/workflow/` initialised, no features |
| C | Branch `wf/2026-04-24-login-page`; chunk `01-login-form` at Design; log has "Design complete" |
| D | Feature whose last chunk is at Awaiting-Promote; `preproduction` exists; `.env.deploy.local` exists |
| E | Two active features simultaneously |
| F | test-app + chunk at Design + NO `design/system/` (bootstrap mode) |
| G | test-app + chunk at Design + existing `design/pages/home.html` (iteration mode) |
| H | test-app + chunk at Code + screenshots exist |
| I | test-app + chunk at QA + dev server runnable |
| J | test-app + chunk at Integrate + on chunk branch |
| K | test-app + LAST chunk at Integrate (multi-chunk feature) |

**test-app location:** `E:\claude\Agent-workflow\test-app\` (READY: Next.js + Tailwind + Playwright; `docs/workflow/design/` will be created by eval 38). Each eval makes its own copy of test-app (via `git clone --depth=1` from the local path) into the eval's `outputs/testdir/` so runs don't contaminate each other.

**Simulation fallback:** When a stage's external tool (chrome-devtools, deployment-status-check) is unavailable, the eval prompt states pass/fail explicitly. Tests workflow logic only.

## 4. Run Order (fore → rear)

Run evals in this phase order against the test-app. Earlier phases must pass before moving to later phases — a failure in an earlier phase often masks problems in later ones.

| Phase | Evals (in order) | Why this phase |
|---|---|---|
| 1. Static prereqs | 1, 3, 6 | Hard-stop messages — fastest to validate, no fixture work |
| 2. Init | 2, 12 | First and idempotent init |
| 3. Pre-feature state | 4, 5, 13, 22 | Status / feature-deps / type-required / no-chunk-in-progress |
| 4. Feature scaffold | 14 | Creates the feature folder + branch — gates everything after |
| 5. With one feature | 11, 16, 17 | Status reads single feature / by-id / archived |
| 6. With multiple features | 15, 21 | Multi-feature listing + run disambiguation |
| 7. Run dispatching deps | 10, 18, 19, 20 | Hard-stop on missing skill for each stage |
| 8. Design stage | 38, 39, 32, 33 | Bootstrap → iterate; handoff format on pass + suppression on fail |
| 9. Code stage | 40, 41, 36 | AC coverage + screenshot coverage + `-a` stops on fail |
| 10. QA stage | 42, 43 | Gate pass / visual mismatch routes back to Code |
| 11. Integrate stage | 44, 45, 46, 47 | Architecture review / full re-run / state files / chunk→feature merge |
| 12. Last chunk | 48, 49 | Feature→preproduction merge + preproduction auto-create |
| 13. State transitions | 7, 8, 9, 23, 24, 25, 26 | advance / block / reject across stages |
| 14. Auto-advance | 35, 37 | Multi-stage multi-chunk; never auto-promote |
| 15. Promote logic | 28, 29 | Precondition checks |

## 5. Eval Catalog (45 evals, 16 groups)

| Group | IDs | Focus |
|---|---|---|
| A: Prerequisite enforcement | 1, 3, 6, 21, 22 | Hard-stop messages; uses `/($)i-wf` notation |
| B: Init | 2, 12 | First run + idempotent re-run |
| C: Status | 4, 11, 15, 16, 17 | No features / one / multi / by id / archived |
| D: Feature | 5, 13, 14 | Brainstorm dep, missing --type, full scaffold |
| E: Run dispatching deps | 10, 18, 19, 20 | Design/Code/QA/Integrate dep checks |
| F: Advance | 7, 23 | Design→Code; last-stage→Awaiting-Promote |
| G: Block | 8, 26 | No-arg with reason; with feature-id arg |
| H: Reject | 9, 24, 25 | Design stays; QA→Code; empty note asks |
| I: Promote (logic) | 28, 29 | Chunks not all Done; missing feature-id |
| K: Handoff block | 32, 33 | Format when passing; suppressed on fail |
| L: Auto-advance `-a` | 35, 36, 37 | Multi-stage multi-chunk; stop on fail; stop at Awaiting-Promote |
| M: Design Modes | 38, 39 | System bootstrap; iterating existing page |
| N: Code Coverage | 40, 41 | All ACs implemented; all screenshot sections covered |
| O: QA Gate | 42, 43 | All 4 checks pass; visual mismatch routes to Code |
| P: Integrate | 44, 45, 46 | Architecture review; full test re-run; state updates |
| Q: Git branches | 47, 48, 49 | Chunk→feature merge; last chunk→preproduction; preprod auto-created |

## 6. Iteration History

| Iteration | Evals | with_skill | without_skill | Delta | Status |
|---|---|---|---|---|---|
| 1 | 1–6 | 100% | 49% | +51% | Complete |
| 2 | 7–11 | 100% | 40% | +60% | Complete (resumed 2026-04-25) |
| 3 | 12–49 (remaining IDs in evals.json) | 100% | 12% | +88% | Complete |

Full merged benchmark across iterations 1-3 now covers all 45 eval IDs in `evals.json`.

**Skill changes from iteration-1:** SKILL.md anti-pattern #3 added — every user-facing command reference must use `/($)i-wf` notation (Codex compat).

## 7. Done Criteria

- All `with_skill` evals at pass_rate 1.0
- Delta `with_skill − without_skill` ≥ 0.5
