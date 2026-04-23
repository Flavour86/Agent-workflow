## What this repo is

A portable LLM workflow system — a collection of Claude Code skills and templates that drive feature development through **Design → Code → QA → Integrate → Promote** with explicit human gates. The skills in this repo are **installed into other projects**, not run here directly. State files (`docs/workflow/`) are always created in the target project, not here.

## Architecture

Three layers:

### 1. Skills — `skills/`

Each subfolder is a deployable Claude Code skill (frontmatter + instructions in `SKILL.md`).

| Skill | Role |
|---|---|
| `skills/workflow/` | Shared orchestrator — all stage logic lives here. All other skills delegate to it. |
| `skills/wf-init/` | Initialize `docs/workflow/` in a target project |
| `skills/wf-feature/` | Intake a feature, propose tree decomposition, scaffold folder |
| `skills/wf-run/` | Run the current stage of a chunk (`-a` auto-advances) |
| `skills/wf-status/` | Read-only dashboard view |
| `skills/wf-advance/` | Approve stage output, advance chunk |
| `skills/wf-reject/` | Redo current stage with feedback note |
| `skills/wf-blocked/` | Mark chunk blocked |
| `skills/wf-promote/` | Merge preproduction → main, deploy, archive |
| `skills/wf-bootstrap/` | One-shot server provisioning (new apps only) |

### 2. Stage references — `skills/workflow/stages/`

One file per stage. `skills/workflow/SKILL.md` dispatches to these. Each file is the authoritative logic for that stage — never improvise outside them.

| File | Handoff type |
|---|---|
| `design.md` | Always human-gate (`-a` does NOT auto-approve) |
| `code.md` | Auto → QA on gate pass |
| `qa.md` | Auto → Integrate on gate pass |
| `integrate.md` | Always human-gate |
| `promote.md` | Triggered by `/wf-promote` only |
| `bootstrap.md` | Triggered by `/wf-bootstrap`, one-shot per app |

### 3. Templates — `skills/workflow/templates/`

Used by `/wf-feature` to scaffold a new feature folder in the target project.

| Template | Purpose |
|---|---|
| `feature.md` | Feature intake metadata |
| `tree.md` | One file per parallel workstream |
| `log.md` | Chronological stage transition log |
| `INDEX-feature.md` | Per-feature chunk state table |

## Core concepts

- **Feature** — a unit of work, decomposed into one or more trees.
- **Tree** — an independent parallel lane. Trees can only be separate if they can start on day 0 without any dependency on another tree. When in doubt, merge into one tree.
- **Chunk** — a vertical slice task (front-end + back-end + API + DB as needed). Chunks within a tree are strictly sequential.
- **Chunk ID format:** `<feature-slug>/<tree>/<NN-slug>` (e.g. `2026-04-20-homepage-refactor/A-hero/01-hero-layout`)
- **Branch naming:** `wf/<feature-slug>/<tree>/<NN>`
- **Stage enum:** `Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`

## Handoff block

Every stop point must print this exact shape:

```
===== WORKFLOW HANDOFF =====
Chunk: <feature>/<tree>/<NN-slug>
Stage: <name>    Gate: go | reject | pause
What I did:
- <bullet>

Artifacts:
- <path or URL> - <note>

Gate check:
- [x] <criterion>
- [ ] <criterion>

Next action:
  /wf-advance
  /wf-reject <note>
  /wf-blocked <reason>
  /wf-promote <id>
============================
```

Same shape every time. Never omit or restructure it.

## Error recovery rules

| Failure | Action |
|---|---|
| Stage gate fails (tests/lint/type-check) | Stop. Log. Wait for `/wf-reject`. No auto-retry. |
| Merge conflict in Integrate | Stop. Print conflicting files. Never auto-resolve. |
| Duplication found in Integrate | Offer three options: extract now / defer to mini-refactor chunk / document-and-ignore. User picks. |
| Subagent crash during `-a` Code | Mark chunk Blocked. Stop `-a`. Do not silently skip. |
| Unexpected git state | Refuse to run. User resolves. |
| `.env.deploy.local` missing at Promote | Stop. Direct to `/wf-bootstrap` or manual creation. |
| SSH drop during Bootstrap | Retry once (5s → 20s backoff). Second fail → Blocked. |
| Playwright baseline missing on first QA | Prompt for baseline creation or reject to fix UI first. |

## State change rules

- State in `docs/workflow/` is changed **only** via workflow commands, never by hand-editing.
- Only exception: `/wf-blocked <reason>` may append a free-text note to the log.
- If `INDEX.md` and a log disagree about a chunk's stage, **the log is authoritative**.
- Never edit anything under `docs/workflow/archive/`.

## Codex / multi-agent usage

For Codex, use `$` prefix instead of `/` (e.g. `$wf-run`, `$wf-advance`). The `workflow` skill's `agents/openai.yaml` has `allow_implicit_invocation: false` — Codex must invoke the skill explicitly via `$workflow ...`.

## Adding or modifying skills

- The `workflow` skill is the single source of truth for orchestration. Changes to stage logic go in `skills/workflow/stages/<stage>.md`.
- Thin wrapper skills (`wf-*`) should only parse arguments and delegate to `workflow`. Do not duplicate orchestration logic in wrappers.
- When creating new stages, add them to the stage enum in `skills/workflow/SKILL.md` and create the matching file in `skills/workflow/stages/`.
