# i-wf Skill Design Document

**Date:** 2026-04-24
**Status:** In progress — brainstorming session with user

---

## 1. Overview

Replace all scattered `wf-*` skills with a single unified skill: **`i-wf` (Iterative Workflow)**.

- Claude Code: `/i-wf <subcommand> [args]`
- Codex: `$i-wf <subcommand> [args]`

---

## 2. Commands

| Command | Args | Purpose |
|---|---|---|
| `init` | — | Set up `docs/workflow/` in a target project |
| `feature` | `<description>` | Intake feature, decompose into chunks |
| `run` | `[feature-id] [-a]` | Run current in-progress chunk's active stage. If feature-id absent, reads root INDEX.md to find what's in progress |
| `advance` | `[-a]` | Approve current stage, advance to next. With `-a`, auto-advances |
| `block` | `[feature-id]` | Mark current chunk and feature as blocked |
| `reject` | `<note>` | Redo current stage with feedback |
| `status` | `[feature-id]` | Read-only dashboard from `docs/workflow/INDEX.md`. Shows which feature/chunk is active and progress |
| `promote` | `<feature-id>` | Merge preproduction → main |
| `bootstrap` | — | One-shot deploy pipeline provisioning for brand-new app |

---

## 3. Architecture Changes from Old Design

### No More Trees

| Old | New |
|---|---|
| Feature → Trees → Chunks (parallel trees) | Feature → Chunks only (sequential) |
| Chunk ID: `<feature-id>/<tree>/<NN-slug>` | Chunk ID: `<feature-id>/<NN-slug>` |
| Branch: `wf/<feature>/<tree>/<NN>` | Branch: `wf/<feature-id>/<NN>` |
| Tree files + tree logs | `chunks.md` + single `log.md` per feature |

Chunks are **strictly sequential** within a feature. No parallel execution.

### Git Branching Model

```
main
 └── wf/<feature-id>            ← feature/refactor/optimization: created from main at /i-wf feature
 └── hotfix/<feature-id>        ← bug type: created from main at /i-wf feature
      └── <prefix>/<feature-id>/<NN>  ← chunk branch, created from feature branch
           ↓ merge when chunk integrate passes
      <prefix>/<feature-id>     ← each chunk merges back into feature branch
           ↓ when ALL chunks done
 └── preproduction              ← created from main if absent; feature branch merges here
           ↓ /i-wf promote
 └── main
```

### Branch naming by type

| Feature type | Feature branch | Chunk branches |
|---|---|---|
| `feature / refactor / optimization` | `wf/<feature-id>` | `wf/<feature-id>/<NN>` |
| `bug` | `hotfix/<feature-id>` | `hotfix/<feature-id>/<NN>` |

- Feature branch is always created from `main`
- Chunk branches are always created from their feature branch
- Each chunk's Integrate merges chunk branch → feature branch
- Last chunk's Integrate merges feature branch → preproduction
- `/i-wf promote` merges preproduction → main

### Feature Folder Structure (in target project)

```
docs/workflow/
├── README.md
├── INDEX.md                          ← root dashboard, all active features
└── features/
    └── <feature-id>/
        ├── feature.md                ← spec and motivation
        ├── INDEX.md                  ← chunk state table
        ├── chunks.md                 ← chunk details, acceptance criteria, design notes
        ├── log.md                    ← chronological log for ALL chunks in this feature
        └── screenshots/              ← annotated screenshots per chunk, showing exactly what changed
            └── <NN-slug>-<section>.png
```

### Multiple features in progress: yes, supported simultaneously.

---

## 4. Stages Per Chunk

Not every chunk goes through all stages. Each chunk **declares its own stage list** at intake time.

| Chunk type | Typical stages |
|---|---|
| New UI feature (`--type feature`) | `design → code → qa → integrate` |
| Backend / API / optimization (`--type feature / optimization`) | `code → qa → integrate` |
| Bug fix (`--type bug`) | `code → qa → integrate` — branch prefix: `hotfix/` |
| Pure refactor (`--type refactor`) | `code → qa → integrate` |
| Config / infra | `code → integrate` |

**Stage enum:** `Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`

`bootstrap` and `promote` are feature-level commands, not per-chunk stages.

---

## 5. Auto-Advance (`-a`) Rules

### Without `-a` (default — human-gated mode)
Every stage stops and waits for explicit human approval via `/i-wf advance` before proceeding to the next stage. Use this mode during initial workflow testing to validate that each stage performs as expected.

### With `-a` (fully automated mode)
Auto-advances through **ALL stages** — Design, Code, QA, Integrate — without stopping for human review.

`-a` stops ONLY at:
- A failed gate (tests fail, lint fails, type errors, QA baseline mismatch, etc.)
- A rejection (`/i-wf reject`)
- A block (`/i-wf block`)
- End of feature (all chunks Done / Awaiting-Promote)
- Never auto-runs Promote
`-a` advances to the next chunk automatically after the current chunk's Integrate completes successfully.

### Design intent
Use **without `-a`** first when adopting the workflow or after changes to the skill — verify each stage output meets expectations before approving. Once the workflow performs reliably, attach `-a` to let it run unattended.

---

## 6. Universal Hard-Fail Criteria (ALL outputs)

Every command/stage output must satisfy **all three**:

1. **Handoff block** is structurally complete and correct
2. **Stage work** meets quality standards for that stage
3. **State files** (`INDEX.md`, `chunks.md`, `log.md`) are updated accurately

Failure in any one of these is a hard fail regardless of the others.

---

## 7. External Dependency Rule

Before any stage that requires an external skill or tool, verify it is available. If missing, **hard stop** immediately:

```
Required: <skill-or-tool-name>
This stage depends on <skill-or-tool-name> which is not installed.
Install it first, then re-run /($)i-wf run <feature-id>.
```

This applies to every external dependency in every stage and command.

---

## 8. Feature Command (`/i-wf feature`)

The feature command is the **root of truth** for the entire workflow. Every stage — Design, Code, QA, Integrate — derives its instructions from what the feature command produces. Any gap or ambiguity here cascades into every stage downstream.

### Process

1. **`superpowers:brainstorming` skill required** — hard stop if not installed, prompt to install before continuing
2. Use brainstorming to deeply explore the feature with the user — collect ALL information
3. **Ambiguity rule:** If anything is unclear, stop immediately and ask the user for every missing detail. Do not proceed with assumptions. The feature intake phase must resolve 100% of ambiguities before scaffolding.
4. Decompose into sequential chunks, each with a complete set of acceptance criteria and a declared stage list
5. Present the proposed decomposition for user approval before scaffolding

### Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| `superpowers:brainstorming` skill invoked | Hard fail if skipped |
| Feature type explicitly declared (`feature / bug / refactor / optimization`) | Hard fail if missing |
| Feature description is unambiguous — no open questions remaining | Hard fail if any ambiguity unresolved; stop and ask user before proceeding |
| Every chunk has a clear, specific description | Hard fail if vague |
| Every chunk has testable acceptance criteria — each criterion can be verified pass/fail | Hard fail if any criterion is vague or subjective (e.g., "make it look nice" → must get specifics) |
| Every chunk has a declared stage list appropriate to its type | Hard fail if stage list is missing or wrong (e.g., backend-only chunk has `design` stage) |
| Nothing is missing — all aspects of the user's request are covered by at least one chunk | Hard fail if any part of the request has no corresponding chunk or criterion |
| User explicitly approves the decomposition before scaffolding begins | Hard fail if scaffolded without approval |
| Feature folder scaffolded correctly: `feature.md`, `INDEX.md`, `chunks.md`, `log.md`, `screenshots/` | Hard fail if any file missing |
| Root `docs/workflow/INDEX.md` updated with new feature row | Hard fail if not updated |
| Scaffolded files committed to `preproduction` branch | Hard fail if not committed |

### Why This Matters

```
Feature command (spec) → Design (visual coverage) → Code (implementation coverage) → QA (verification)
```

If the feature command misses a requirement → Design has no visual for it → Code has nothing to implement → QA cannot verify it → the gap reaches production silently. The feature command is the **only place** where this chain can be validated completely.

---

## 9. Design Stage

### Living Design System

Design outputs are **not markdown**. They are HTML + CSS files, renderable in a browser.

```
docs/workflow/design/
├── system/
│   ├── tokens.html       ← including font scale, weights, line heights, spacing scale, color .etc, anyway for all  
|   |                       tokens used by application
│   └── overview.md       ← design summary
├── pages/
│   ├── homepage.html     ← full-page visual mockup
│   ├── homepage.css
│   ├── dashboard.html
│   └── dashboard.css
└── components/           ← for common components
    ├── calendar.html     ← component mockup with ALL interaction states
    ├── calendar.css
    ├── nav.html
    └── nav.css
```

**Key principle:** Design files are a **living document** — they reflect the current state of the app, not accumulated history. Sections get updated or removed. The folder stays at a reasonable size.

**Design ≠ Code:** Design stage produces specs and mockups only. Nothing touches production code. Code implementation happens in Code stage.

### Design Modes

| Mode | Trigger | What happens |
|---|---|---|
| **Design system bootstrap** | First feature, brand-new app, no `design/system/` exists | `ui-ux-pro-max` defines full design system: tokens, colors, typography, spacing, layout grid → written to `docs/workflow/design/system/` |
| **Prototype provided** | User passes a file/screenshot from a design tool (Figma, design agent, etc.) | Copy + rename to `docs/workflow/design/pages/<name>.html` — nothing more |
| **Brand-new page** | New page, no existing `.html` file, design system exists | `ui-ux-pro-max` creates entire page as high-fidelity HTML + CSS mockup using established design system tokens |
| **Iterating existing page** | `design/pages/<name>.html` already exists | Read existing file → update only the changed sections in place → annotate screenshot of changed area |

### Design Stage Fidelity

- High-fidelity HTML + CSS mockups
- Must use actual design system tokens (CSS variables / Tailwind classes from `design/system/`)
- `ui-ux-pro-max` skill required for brand-new page design
- Hard stop if `ui-ux-pro-max` is not installed

### Design Stage — Screenshot Workflow

After designing:
1. Open the `.html` file in browser via chrome-devtools MCP
2. Take screenshot of the affected section
3. Annotate / circle / highlight the changed areas
4. Save annotated screenshot to `docs/workflow/features/<feature-id>/screenshots/<NN-slug>-<section>.png`
5. Reference the screenshot path in the handoff block so the developer sees exactly what to build

Screenshots are the **primary communication tool** from designer to developer. They show what changes — not just what the final state is.

### Design Stage — Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| All acceptance criteria from `features/<feature-id>/INDEX.md` for this chunk have a visual representation in the mockup | Hard fail if any criterion is not visually covered — gap here = gap in Code |
| Only existing design tokens used, or delta explicitly flagged | Hard fail if new tokens invented without flagging |
| Component breakdown specific enough — developer makes zero design decisions while coding | Hard fail if vague (e.g., "a button" instead of "`<PrimaryButton>` disabled until form valid") |
| For iteration: only changed sections differ; rest of the file untouched | Hard fail if entire file rewritten |
| Annotated screenshot saved to `features/<feature-id>/screenshots/` | Hard fail if missing |
| `ui-ux-pro-max` invoked for brand-new page design | Hard fail if skipped |
| `design/system/` created for first-time app design | Hard fail if skipped |
| State files updated (INDEX.md stage, chunks.md design notes) | Hard fail if not updated |
| Changes committed to chunk branch | Hard fail if not committed |

### Design Stage — Rejection Path

- Append rejection note to `log.md`
- Clear Design notes section in `chunks.md`
- Clear the changed section in the design HTML (revert to pre-design state)
- Redo Design stage immediately with rejection note in context

---

## 9. Code Stage

### Coding Rules
- Business code in domain folders (`chat/list/friends/`, etc.)
```Example
chat/
   list/  ← conversation list related code
      friends/  ← private list related code
      groups/  ← group list related code
   chat-main/  ← chat main, includes header, box, footer(input)
      chat-header/
      chat-box/
      chat-footer/
```
If we develop the friends list, and we should create the `chat` and `list` folder first.
- Common/shared code by type (e.g. `components/`, `utils/`, `hooks/`)
- Only move to common folder when actually used by more than one feature
- TDD: red → green → refactor per acceptance criterion
- Follow design notes from Design stage exactly
- Read CLAUDE.md / Agent.md / Gemini.md for project patterns

### Gate Checklist — Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| `pnpm test` — all tests pass | Hard fail if any test fails |
| `pnpm type-check` — zero type errors | Hard fail if any error |
| `pnpm lint` — zero lint errors | Hard fail if any error |
| Unused code removed from all files touched by this chunk | Hard fail if dead code remains |
| File placement correct — business code in domain folder, common code by type | Hard fail — must fix before advancing, cannot defer to Integrate |
| **All requirements in `features/<feature-id>/INDEX.md` for this chunk are covered by the code** | Hard fail if any requirement is missing from the implementation |
| **All UI sections shown in `features/<feature-id>/screenshots/` for this chunk are implemented** | Hard fail if any screenshot section has no corresponding code |
| State files updated (INDEX.md chunk stage, log.md entry) | Hard fail if not updated |
| Changes committed to chunk branch | Hard fail if not committed |

### Coverage Chain (Design → Code accountability)

The screenshot and requirements checks create an explicit chain:

1. `/i-wf feature` writes all acceptance criteria to `chunks.md` and `INDEX.md`
2. **Design stage** must visually cover every criterion → produces annotated screenshots
3. **Code stage** must implement every screenshot section AND every requirement in `INDEX.md`

If Design missed a requirement → Code will also miss it. This is why Design completeness is a hard fail: gaps in Design propagate directly to gaps in Code.

### Rejection Path
Append rejection note to `log.md`, leave chunk at Code stage, do not revert commits automatically. Redo Code stage immediately with rejection note in context.

---

## 10. QA Stage

**Gate:** Human-gate without `-a`. Auto-advances to Integrate with `-a` only if gate passes.

### Visual Check — How It Works

QA does NOT use a stored regression baseline. The design mockup is always the reference:

1. Open the live running app in browser via chrome-devtools MCP
2. Navigate to the section(s) relevant to this chunk
3. Take a screenshot of each relevant section
4. Compare each screenshot against the corresponding annotated design screenshot in `features/<feature-id>/screenshots/<NN-slug>-<section>.png`
5. The LLM assesses whether the implementation matches the design intent for that section

### Gate Checklist — Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| `pnpm test:e2e` passes for this chunk's routes | Hard fail if any E2E test fails |
| Every section shown in the design screenshot is visually implemented correctly in the live app | Hard fail if any section does not match the design intent |
| Zero console errors in browser | Hard fail if any console error |
| Zero failed network requests | Hard fail if any request fails |
| QA report appended to `log.md` (E2E result, visual comparison result per section) | Hard fail if not logged |
| State files updated (INDEX.md chunk stage) | Hard fail if not updated |

**Gate passes ONLY when BOTH conditions are true:**
1. E2E tests pass
2. All relevant sections of the live app visually match the design mockup
3. State and Log files updated according to Gate Checklist

If either fails → hard fail, chunk routes back to Code stage with the failure details.

### Rejection Path
Append rejection note to `log.md`. Route chunk back to Code stage. Redo Code stage with the QA failure details in context.

---

## 11. Integrate Stage

**Gate:** Always human-gate (even with `-a`). Stops after preproduction is pushed so the user can review before promoting.

### Steps Overview

1. Preflight: QA gate passed, working tree clean, on chunk branch `wf/<feature-id>/<NN>`
2. Invoke `code-review` skill — if blocking findings, stop and wait for `/i-wf reject`
3. **Architecture review** — fix any violations before proceeding (see below)
4. Fetch and check out the feature branch `wf/<feature-id>`
5. Rebase chunk branch onto feature branch — stop on conflict, never auto-resolve
6. Merge rebased chunk branch into feature branch
7. **Run full test suite on feature branch** (see below) — fix in-place if failing, re-run until passing
8. Push feature branch to origin
9. Delete chunk branch locally and remotely
10. Collapse chunk section in `chunks.md` to one-line summary + log link
11. Update `INDEX.md`: chunk stage → `Done`
12. Append to `log.md`: integrate complete, architecture decision, push commit hash
13. Run `graphify update .` if `graphify-out/` exists
14. **If this is the last chunk in the feature:**
    a. Fetch/create `preproduction` from `main` if absent
    b. Rebase feature branch onto `preproduction` — stop on conflict, never auto-resolve
    c. Merge feature branch into `preproduction`
    d. Run full test suite on `preproduction` — fix in-place if failing
    e. Push `preproduction` to origin
    f. Update `INDEX.md`: feature status → `Awaiting-Promote`
15. Print handoff — user reviews before `/i-wf promote`

### Architecture Review (hard block)

Before merging, get all files created or modified by this chunk and evaluate each:

**Business code rule:** Feature-specific code must live in its domain folder (e.g., `chat/list/friends/`). Business code found in a generic folder (`components/`, `utils/`, `hooks/`) that is only used by one feature is a violation.

**Common code rule:** Code used across multiple features/modules must live in a type-based folder (`components/`, `utils/`, `hooks/`). Shared code still sitting in a feature folder is a violation.

**Outcome:** Hard block — fix the violation in-place within Integrate stage, commit, then proceed. No defer or document option. Do not route back to Code stage.

### Full Test Suite (runs for every chunk integration and modified file's related test, not only shared code changes)

After merging the chunk into the feature branch, run:
1. `pnpm test` — full unit test suite (not scoped to this chunk)
2. `pnpm test:e2e` — full E2E suite (not scoped to this chunk)
3. `pnpm type-check` and `pnpm lint`

**If any test fails:** fix the code in-place within Integrate stage, commit the fix, re-run the full suite. Repeat until all pass. Do **not** route back to Code stage — that would restart the entire Code → QA → Integrate cycle unnecessarily.

### Gate Checklist — Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| `code-review` skill passed with no blocking findings | Hard fail if unresolved |
| All file placement violations fixed before merge | Hard block — fix in-place, no exceptions |
| Rebase onto feature branch clean | Hard fail if conflicts — stop, print files, never auto-resolve |
| Merge into feature branch successful | Hard fail if merge fails |
| Full unit + E2E + type-check + lint green on feature branch after merge | Hard fail; fix in-place and re-run until passing |
| If last chunk: feature branch rebased and merged into `preproduction` cleanly | Hard fail if not done |
| If last chunk: full test suite green on `preproduction` | Hard fail; fix in-place |
| Feature branch pushed / `preproduction` pushed (last chunk) | Hard fail if not pushed |
| Chunk branch deleted locally and remotely | Hard fail if not cleaned up |
| `chunks.md`, `INDEX.md`, `log.md` updated | Hard fail if not updated |
| `graphify-out/` updated (if folder exists) | Hard fail if not updated |

### Rejection Path
Rare — merge is already done. User must specify: revert the merge or leave in place and flag a follow-up chunk. Never auto-revert.

---

## 12. Handoff Block — Exact Specification

### Core principle

**The handoff block is only ever shown when ALL gate checks have passed.** Its presence is the signal that everything is good and the user's approval is needed to proceed. If anything fails or needs human input, the skill hard stops with a plain-text message — the handoff block is never shown in that case.

| Situation | Output |
|---|---|
| All gate checks pass | Show handoff block → wait for `/($)i-wf advance` (or auto-advance with `-a`) |
| Any check fails or human input needed | Hard stop with plain text — **no handoff block shown** |

### Format

```
===== WORKFLOW HANDOFF =====
Feature: <feature-id>
Chunk:   <feature-id>/<NN-slug>
Stage:   <Design | Code | QA | Integrate>

What I did:
- <concrete action taken>
- <concrete action taken>

Artifacts:
- <exact file path> — <what it is>
- <features/<feature-id>/screenshots/<NN-slug>-<section>.png> — <annotated screenshot>

Gate check:
- [x] <criterion>
- [x] <criterion>

Next action:
  /($)i-wf advance
  /($)i-wf reject <note>
  /($)i-wf block <reason>
  /($)i-wf promote <feature-id>   ← only shown at Awaiting-Promote
============================
```

### Hard-fail rules for the handoff block

| Field | Rule |
|---|---|
| `Feature` + `Chunk` | Exact IDs matching `INDEX.md` — no placeholders |
| `Stage` | Must match the stage that just ran |
| No `Gate` field | Removed — the block's presence means all checks passed |
| `What I did` | At least one concrete bullet describing what actually happened |
| `Artifacts` | Every file created or modified with exact path. Screenshots always included when produced |
| `Gate check` | Every criterion from the stage checklist listed — none omitted. All must be `[x]` |
| Any `[ ]` in gate check | **Forbidden** — fix internally, re-run, repeat until all `[x]`. Never show the handoff with a failing criterion |
| `Next action` | Only valid commands for this stage. `promote` only shown at `Awaiting-Promote` |

### Internal retry rule

If any gate criterion fails, the skill fixes the issue internally and re-runs — no handoff, no user prompt. The human only ever sees the handoff when everything has passed.

---

## 13. Anti-patterns — Prerequisite Enforcement

There is one anti-pattern: **never execute a subcommand whose prerequisites have not been met.**

### Prerequisite chain

```
init  →  feature  →  run / advance / block / reject / promote / status
```

| Subcommand | Prerequisite | If missing — hard stop message |
|---|---|---|
| Any subcommand except `init` and `bootstrap` | `docs/workflow/` exists (i.e., `init` was run) | `Workflow not initialised. Run /($)i-wf init first.` |
| `run`, `advance`, `block`, `reject`, `promote` | At least one active feature exists in `docs/workflow/INDEX.md` | `No active feature. Run /($)i-wf feature <description> to start one.` |
| `advance`, `block`, `reject` | At least one chunk is currently in progress | `No chunk in progress. Check /($)i-wf status to see the current state.` |

Check prerequisites at the very start of every subcommand, before doing any work.

### Never invoke implicitly

The skill must only execute when the user **explicitly** types `/i-wf <subcommand>` (Claude Code) or `$i-wf <subcommand>` (Codex). The skill never invokes itself, never triggers another subcommand on the user's behalf, and never decides on its own that "now would be a good time to advance/run/promote." Every execution is user-initiated, every time.

Enforced by `disable-model-invocation: true` in `SKILL.md` frontmatter.

---

## 14. Promote Command (`/i-wf promote <feature-id>`)

Merges `preproduction` → `main`, triggers CI/CD auto-deploy, verifies live app, tags, and archives. Never auto-runs — always explicit user invocation.

### Preconditions (hard stop if any fail)

- All chunks in the feature show `Done` or `Awaiting-Promote`
- `preproduction` branch exists and has been pushed
- `.env.deploy.local` exists
- `deployment-status-check` skill available — hard stop if missing

### Steps

1. Preflight: clean working tree
2. `git checkout main && git pull origin main`
3. `git merge --no-ff preproduction -m "promote: <feature-id>"`
4. If merge conflict: hard stop, print conflicting files, never auto-resolve
5. `git push origin main`
6. Invoke `deployment-status-check` skill — wait for CI/CD to complete
7. If deployment fails: hard stop, tell user to create a fix-forward bug chunk via `/($)i-wf feature <fix-description> --type bug`. No revert, ever.
8. **Smoke check** (all must pass):
   a. Navigate to every route touched by this feature via chrome-devtools MCP
   b. Verify each route returns HTTP 200 with zero console errors and zero failed network requests
   c. Take screenshots of each route and visually compare against the corresponding design mockups in `docs/workflow/design/pages/`
   d. If any route fails or visual mismatch found: hard stop, fix-forward hotfix only
9. Tag: `git tag feature/<feature-id>-done && git push origin --tags`
10. Delete all `wf/<feature-id>/*` and `hotfix/<feature-id>/*` branches locally and remotely
11. Move `docs/workflow/features/<feature-id>/` → `docs/workflow/archive/<YYYY-QQ>/<feature-id>/`
12. Remove feature row from `docs/workflow/INDEX.md`
13. `git add -A && git commit -m "archive: <feature-id>" && git push origin main`

### Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| All chunks `Done` or `Awaiting-Promote` before starting | Hard fail if any chunk not finished |
| Merge to `main` clean | Hard fail if conflict — stop, print files, never auto-resolve |
| `git push origin main` succeeded | Hard fail if push fails |
| `deployment-status-check` reports green | Hard fail; fix-forward hotfix only — never revert |
| Every touched route: HTTP 200, zero console errors, zero failed network requests | Hard fail; fix-forward only |
| Visual smoke check: live app matches design mockups for all touched routes | Hard fail; fix-forward only |
| Release tag pushed | Hard fail if not tagged |
| All `wf/<feature-id>/*` and `hotfix/<feature-id>/*` branches deleted | Hard fail if lingering branches |
| Feature folder archived to `docs/workflow/archive/<YYYY-QQ>/` | Hard fail if not archived |
| Root `INDEX.md` row removed | Hard fail if row remains |
| Archive commit pushed to `main` | Hard fail if not pushed |

### Deployment failure rule

If deployment fails at any point after the merge to `main`: **never revert**. Instruct the user to create a fix-forward bug chunk:
```
Deploy failed. Create a fix-forward hotfix:
/($)i-wf feature <description of fix> --type bug
```

---

## 15. Status Command (`/i-wf status [feature-id]`)

Read-only. Never modifies any file.

### Output format — no argument (all active features)

One line per active feature:

```
<feature-id>    chunk <NN-slug>    <Stage>    <feature-type>
```

Example:
```
2026-04-20-chat-feature      chunk 02-send-button    Code      feature
2026-04-22-dashboard-ui      chunk 01-layout          Design    feature
2026-04-23-login-fix         chunk 01-auth-token      QA        bug
```

If no active features: `No active features. Start one with /($)i-wf feature <description>.`

### Output format — with feature-id argument

Print the full chunk state table from `docs/workflow/features/<feature-id>/INDEX.md` verbatim.

If the feature-id is not found in `features/`, check `docs/workflow/archive/` and print from there, noting it is archived.

If not found anywhere, print an error listing all active feature IDs.

### Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| No files modified | Hard fail if any file is written or changed |
| All active features shown (no-arg form) | Hard fail if any active feature in INDEX.md is omitted |
| Current chunk and stage are accurate — match `INDEX.md` | Hard fail if stale or incorrect |
| Feature-id form: full chunk table printed verbatim | Hard fail if truncated or reformatted |
| Archived features noted as archived when found in `archive/` | Hard fail if not flagged |

---

## 16. Bootstrap Command (`/i-wf bootstrap`)

One-shot deploy pipeline provisioning for a brand-new app. Skip if already set up. Interactive — never echo passwords into chat.

### Preconditions

- App name: from argument or read from `package.json`
- If `.env.deploy.local`, `.github/workflows/deploy.yml`, and deploy SSH key all already exist: ask user to confirm re-bootstrap before proceeding
- `deployment-status-check` skill required — hard stop if missing

### Steps

1. Check/create `.env.deploy.local` with: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_APP_PATH`, `DEPLOY_PASSWORD`. Wait for user to confirm before reading.
2. Generate Ed25519 deploy key at `~/.ssh/<app-name>_deploy` if absent
3. Install public key on server via `ssh-copy-id` — interactive password prompt. If fails: hard stop, warn password line is still in `.env.deploy.local`
4. Verify key-only auth (`PasswordAuthentication=no`)
5. Instruct user to remove `DEPLOY_PASSWORD` line from `.env.deploy.local`, wait for confirmation, re-read and verify it is gone
6. Append SSH host entry to `~/.ssh/config`
7. Provision server: create app directory, ensure Docker and nginx installed
8. Sync initial configs via `rsync`
9. Create `.github/workflows/deploy.yml`, set GitHub secrets, commit and push to `main`
10. Invoke `deployment-status-check` skill — confirm workflow is registered
11. Write `DEPLOY.md` at project root

### Acceptance Criteria (all hard-fail)

| Criterion | Check |
|---|---|
| Deploy key installed and key-only auth verified | Hard fail if password auth still required |
| `DEPLOY_PASSWORD` line removed from `.env.deploy.local` before continuing | Hard fail if line remains |
| SSH config entry added | Hard fail if missing |
| Server: app directory exists, Docker + nginx ready | Hard fail if not provisioned |
| Initial configs synced to server | Hard fail if rsync fails |
| `.github/workflows/deploy.yml` committed and pushed | Hard fail if not pushed |
| GitHub secrets set | Hard fail if missing |
| `deployment-status-check` reports workflow is live | Hard fail if workflow not registered |
| `DEPLOY.md` written at project root | Hard fail if missing |

### Failure recovery

If `ssh-copy-id` fails: hard stop immediately. Print error verbatim. Warn that `DEPLOY_PASSWORD` is still in `.env.deploy.local` and must be removed before retrying Bootstrap.

---

## 17. Summary — All Acceptance Criteria Defined

All open questions resolved. The design document is complete and ready for implementation planning.

---

## 14. Skill File Structure (planned)

```
skills/i-wf/
├── SKILL.md                  ← main dispatcher + shared concepts
├── commands/
│   ├── init.md
│   ├── feature.md
│   ├── run.md
│   ├── advance.md
│   ├── block.md
│   ├── reject.md
│   ├── status.md
│   ├── promote.md
│   └── bootstrap.md
├── stages/
│   ├── design.md
│   ├── code.md
│   ├── qa.md
│   └── integrate.md
└── templates/
    ├── feature.md
    ├── chunks.md
    ├── log.md
    └── INDEX.md
```
