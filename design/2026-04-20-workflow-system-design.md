# Iterative Feature Workflow System — Design

**Date:** 2026-04-20
**Type:** Tooling / Process design
**Status:** Design approved; implementation plan pending

## Purpose

Build a reusable LLM models workflow that takes a feature request, decomposes it
into independently advanceable chunks, and drives each chunk through
Design → Code → QA → Integrate → Promote with explicit human gates between
stages. The system must be portable across projects and navigable by any LLM
(Sonnet, GPT, Gemini), not just the model that authored it. So the application developemnt history becomes
chaseable and easy to LLM models understand where the iterations are

Long-term use: every future feature, bugfix, refactor, and optimization.

## Non-goals

- Replace human judgment at stage boundaries.
- Provide real-time concurrent execution (multi-session) in v1.
- Manage product planning outside chunk execution (no roadmap, no estimation).
- Support deployment targets other than Docker + nginx behind a CI/CD webhook.

## Architecture

Three layers.

### 1. Slash commands — `.claude/commands/wf-*.md`

Thin entry points routed to the workflow skill.

| Command | Args | Behavior |
|---|---|---|
| `/feature` | `<description> --type feature\|bug\|refactor\|optimization` | Reads project (CLAUDE.md, graphify, code). Proposes tree decomposition. On approval, scaffolds feature folder |
| `/wf-status` | `[feature-id]` | No arg → root INDEX. With arg → that feature's INDEX. |
| `/wf-run` | `<chunk-id> [-a]` | Runs current stage of the chunk. `-a` auto-continues through stages and subsequent chunks in the same tree until a human gate or block. |
| `/wf-advance` | — | After human approval, advance chunk to next stage. |
| `/wf-reject` | `<note>` | Redo current stage with feedback. |
| `/wf-blocked` | `<reason>` | Mark chunk Blocked; excluded from `-a`. |
| `/wf-promote` | `<feature-id>` | Merge `preproduction` → `main`, push, smoke-check, archive feature folder. |
| `/wf-bootstrap` | `<app-name>` | One-shot server provisioning (new apps only). |

### 2. Skill — `.claude/skills/workflow/SKILL.md`

Single skill orchestrating all stages. Sub-sections per stage keep logic in one
reasoning location. Skill responsibilities:
- Read state files + git to load chunk context.
- Dispatch to stage logic (Design / Code / QA / Integrate / Promote / Bootstrap).
- Write artifacts, update state files, append to log.
- Print the structured handoff block at every stop point.

### 3. State — `docs/workflow/`

Plain markdown, git-tracked. Schema below.

## Folder structure

```
docs/workflow/
├── README.md                           # LLM navigation guide
├── INDEX.md                            # root entry map — pointers to per-feature indexes
├── features/
│   └── 2026-04-20-homepage-refactor/
│       ├── INDEX.md                    # feature dashboard: all chunks × stage × branch
│       ├── feature.md                  # intake: description, type, motivation, tree plan
│       ├── trees/
│       │   ├── A-hero.md               # whole tree in one file (goal + all chunks + specs)
│       │   ├── B-nav.md
│       │   └── C-feature-grid.md
│       └── logs/
│           ├── A-hero.log.md           # tree-level log (stage transitions for all chunks)
│           └── B-nav.log.md
└── archive/
    └── 2026-Q2/
        └── 2026-04-20-homepage-refactor/   # whole feature moved here after promote
```

### Why nested per feature

Trees belong to a feature; chunks belong to a tree. Flat layout would force long
prefixed filenames and lose hierarchy. Feature-scoped folders are self-contained
and trivially archivable.

### Why one tree = one file

Chunk specs are small (a few paragraphs + acceptance criteria). Keeping a tree
in one markdown file means a single read loads all chunks + dependencies for
that lane. Numeric prefixes (`01-`, `02-`) inside the file show sequence.

### Why split INDEX per feature

Root `INDEX.md` must stay small as the project grows. It is an entry map —
each active feature is one row with a link. Feature-level `INDEX.md` is the
authoritative chunk state table for that feature. New LLMs reading the
project start at root INDEX, jump one hop to feature INDEX, then open tree
files only for the work they are doing.

### INDEX schemas

**Root `INDEX.md`:**

```markdown
# Workflow Dashboard

Read `README.md` first if unfamiliar with this system.

## Active features

| Feature | Type | Created | Progress | INDEX |
|---|---|---|---|---|
| homepage-refactor | refactor | 2026-04-20 | 3/7 chunks Done | [link](features/2026-04-20-homepage-refactor/INDEX.md) |

## Archived
See `archive/`.
```

**Feature-level `INDEX.md`:**

```markdown
# Feature: Homepage Refactor

**Type:** refactor
**Created:** 2026-04-20
**Status:** In progress

## State

| Tree | Chunk | Stage | Branch | Updated |
|---|---|---|---|---|
| A-hero | 01-hero-layout | QA | wf/homepage-refactor/A-hero/01 | 2026-04-20 |
| A-hero | 02-hero-cta | Pending | — | — |
| B-nav | 01-nav-mobile | Code | wf/homepage-refactor/B-nav/01 | 2026-04-20 |
```

### Stage enum

`Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`

### Branch naming

`wf/<feature-slug>/<tree>/<NN>` — groupable via `git branch --list wf/<feature>/*`.

## Decomposition model — trees and chunks

`/feature` reads the project, then proposes a decomposition tree. The LLM does
this adaptively:

- UI refactor → likely slices by visual section (trees = sections).
- Backend feature → likely single tree with vertical layering (DB → API → UI).
- Mixed work → mixed shape; LLM proposes and user approves.

**Rules of decomposition:**
- Trees are independent lanes. No chunk in one tree blocks a chunk in another.
- Chunks within a tree are strictly sequential.
- Each chunk is a vertical slice of its concern (front-end + back-end + API + DB
  as needed for that chunk) — never a horizontal layer across the whole tree.

## Stage pipeline

### Design
- **Invokes:** `ui-ux-pro-max` skill.
- **Produces:** mockup + design spec written into the chunk's section of the tree file.
- **Gate:** mockup produced, only references existing design tokens, human approves.
- **Handoff:** always human-gate. `-a` does not auto-approve Design.

### Code
- **Invokes:** `superpowers:test-driven-development` + `vercel-react-best-practices` skill.
- **Produces:** implementation on `wf/<feature>/<tree>/<NN>` branch.
- **Gate:** `pnpm test` green, `pnpm type-check` clean, `pnpm lint` clean.
- **Handoff:** auto → QA on gate pass.
- **`-a` mode:** for each next chunk in the same tree, dispatch a fresh subagent
  (cold context via `Agent` tool), wait for completion, revoke before spawning
  the next. Sequential but with clean context per chunk.

### QA
- **Invokes:** Playwright + visual-regression + console scanner.
- **Produces:** test report appended to log; screenshots saved.
- **Gate:** Playwright E2E pass, visual baseline pass, zero console/network errors.
- **Handoff:** auto → Integrate on gate pass.

### Integrate
- **Invokes:** git + cross-chunk duplication reviewer.
- **Actions:**
  1. Rebase `wf/<feature>/<tree>/<NN>` onto `preproduction`.
  2. Run duplication review on files touched by the chunk plus files touched by
     this feature's other chunks already merged into `preproduction`. Extract
     shared logic when found,
     or defer to a mini-refactor chunk, or document-and-ignore — user picks.
  3. Merge into `preproduction`, push.
  4. Delete the chunk branch `wf/<feature>/<tree>/<NN>`.
  5. In the tree file, collapse this chunk's in-progress artifacts to a one-line
     summary plus a link to its log entry.
- **Gate:** rebase clean, tests green on preproduction, duplication review resolved.
- **Handoff:** **always human-gate.** Stops so the user can review preproduction.

### Awaiting-Promote
- Not a stage the workflow runs — it's a holding state until the user runs
  `/wf-promote <feature-id>`.

### Promote (triggered by `/wf-promote`)
- **Actions:** merge `preproduction` → `main`, push `main`, server's CI/CD
  auto-deploys, run `deployment-status-check`, tag `feature/<id>-done`,
  move `features/<feature-id>/` → `archive/YYYY-QQ/<feature-id>/`, delete
  lingering `wf/<feature>/*` branches, remove root INDEX row.
- **Gate:** merge clean, main push succeeds, smoke check HTTP 200 on the
  feature's public routes.

### Bootstrap (triggered by `/wf-bootstrap`, one-shot per app)
- Not per-chunk. Runs only for brand-new apps. For the existing `collab`
  project, this is skipped.
- **Actions:**
  1. Prompt for SSH target, user, port, app path. User pastes values into
     gitignored `.env.deploy.local`. **Password (if any) pasted there, not in chat.**
  2. Generate Ed25519 deploy key if absent.
  3. Install key on server via `ssh-copy-id`. If password auth needed, use
     `mcp__desktop-commander__interact_with_process` (no `sshpass` dependency)
     OR `sshpass` if the user has it installed.
  4. Verify key-auth with `ssh -o PasswordAuthentication=no <alias> "echo ok"`.
  5. Prompt user to delete the password line from `.env.deploy.local`.
  6. Write `~/.ssh/config` Host entry for the server.
  7. Provision server: docker, nginx, app directory.
  8. Rsync initial `docker-compose.yml` + nginx vhost template to server.
  9. Create GitHub Actions workflow (SSH-key-in-repo-secret model) via `gh` CLI;
     store deploy key in `gh secret set DEPLOY_SSH_KEY`.
 10. Run `deployment-status-check` to confirm the pipeline is registered.
 11. Write `DEPLOY.md` with rollback command and `ssh <alias>` shortcut.

Failure in step 3 (`ssh-copy-id`) must fail loudly so the password doesn't
linger in `.env.deploy.local`. Wrap in try/verify/report.

## Parallelism model

**v1: logical parallelism (P1).** Trees can be advanced in any order. INDEX
shows all active trees. Only one chunk runs in this coding assist session at a
time, but no sequencing constraints across trees.

**v2 (later): worktree parallelism (P2).** Code stage dispatched to background
subagents with `isolation: worktree`. Design / QA / Integrate still block on
human gates. Not in v1; added once v1 is proven.

## Subagent dispatch — Code stage with `-a`

When `/wf-run <chunk-id> -a` is active and the workflow advances to the next
chunk in the same tree for the Code stage:

1. Call `Agent` tool with a self-contained prompt describing the chunk's spec,
   acceptance criteria, and TDD constraints.
2. Wait for the subagent to finish.
3. After it returns (pass or fail), do not reuse it. Start fresh for the next
   chunk.
4. If a subagent crashes or fails, mark its chunk Failed, log the crash, stop
   `-a`. Do not silently skip.

Design / QA / Integrate stages always run in the main agent, because they end
at human gates.

## Handoff output — always

```
━━━━━━━━ WORKFLOW HANDOFF ━━━━━━━━
Chunk: <feature>/<tree>/<NN-slug>
Stage: <name>    Gate: go | reject | pause

What I did:
- <bullets>

Artifacts:
- <path or URL> — <note>

Gate check:
- [x] tests pass  [x] type-check clean  [ ] ...

Next action:
  /wf-advance          # approve → next stage
  /wf-reject <note>    # redo this stage
  /wf-blocked <reason> # pause
  /wf-promote <id>     # only at Awaiting-Promote
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Printed at every stop point. Same shape every time. Greppable. Explicit
next-action list removes ambiguity.

## Error recovery

| Failure | Rule |
|---|---|
| Stage gate fails (tests/lint/type) | Stop + log + wait. No auto-retry. |
| SSH drop during Bootstrap/Deploy | Retry once with backoff (5s → 20s). Second fail → Blocked. |
| Merge conflict in Integrate | Stop. Print conflicting files. Never auto-resolve. |
| Duplication found in Integrate | Not a failure. Offer extract-now / defer-to-chunk / document-and-ignore. |
| Subagent crashes during `-a` Code | Mark chunk Failed. Stop `-a`. Don't skip silently. |
| Unexpected git state | Refuse to run. Never auto-stash. User resolves. |
| `.env.deploy` missing at Deploy/Promote | Stop. Direct to `/wf-bootstrap` or manual create. |
| Playwright baseline missing on first QA | Prompt for baseline creation or reject to fix UI first. |

## Cleanup policy

| Trigger | Git | Folders |
|---|---|---|
| Integrate + preproduction push succeeds | Delete `wf/<feature>/<tree>/<NN>` branch | Collapse chunk in tree file to summary + log link |
| All chunks in a tree reach preproduction | — | Tree file header → `Awaiting-Promote` |
| Feature promoted (preproduction → main) | Delete lingering `wf/<feature>/*` branches; tag `feature/<id>-done` | Move `features/<feature-id>/` → `archive/YYYY-QQ/<feature-id>/`; remove root INDEX row |
| `/wf-reject` | Keep branch, keep artifacts | Log the rejection; no cleanup |

At any moment, `features/` contains only in-flight work. Completed history
sits in `archive/` but remains readable. `wf/*` branches only exist for
active chunks.

## `docs/workflow/README.md` — navigation guide

Contents:

1. **Navigation:** `INDEX.md` → feature's `INDEX.md` → tree file → log.
2. **Conventions:**
   - Chunk ID: `<feature-slug>/<tree>/<NN-slug>`
   - Branch: `wf/<feature-slug>/<tree>/<NN>`
   - Stage enum is fixed (see above)
   - All files are plain markdown with tables — no custom syntax
3. **State change rule:** only via slash commands. Never hand-edit state,
   except `/wf-blocked <reason>` may leave a free-text note in the log.
4. **Conflict resolution:** if INDEX and log disagree, **log is authoritative.**
5. **Archive rule:** never edit under `archive/`.

## Permission pre-allowlist — `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)", "Bash(pnpm *)", "Bash(gh *)",
      "Bash(docker *)", "Bash(docker compose *)",
      "Bash(ssh *)", "Bash(scp *)", "Bash(rsync *)",
      "Bash(ssh-copy-id *)", "Bash(ssh-keygen *)", "Bash(ssh-keyscan *)",
      "mcp__desktop-commander__start_process",
      "mcp__desktop-commander__interact_with_process",
      "mcp__chrome-devtools__*"
    ]
  }
}
```

After one week of real use, run `fewer-permission-prompts` skill to tighten
this list based on actual traffic.

## Tools and skills used

- `superpowers:ui-ux-pro-max` — Design stage
- `superpowers:test-driven-development` — Code stage
- `superpowers:executing-plans` — Bootstrap as a resumable plan
- `superpowers:writing-skills` — authoring the workflow skill itself
- `fewer-permission-prompts` — post-launch permission tightening
- `deployment-status-check` — Bootstrap verification + Promote smoke check
- `context7` MCP — current patterns for GitHub Actions, docker-compose, nginx
- `gh` CLI — GitHub Actions workflow + secrets
- `mcp__desktop-commander__interact_with_process` — interactive prompts (SSH
  password during Bootstrap, one-time use only)
- `mcp__chrome-devtools__*` — QA smoke checks + Promote verification
- Plain Bash — git, ssh, scp, rsync, ssh-copy-id (the deleted `ssh` skill's
  content is captured inline here and in the Bootstrap stage spec)

## Out of scope for v1

- Parallel subagent execution across trees (P2) — future enhancement
- Auto-approve Design stage — always human-gated in v1
- Roadmap / estimation / planning beyond the feature being worked on
- Deploy targets other than Docker + nginx + GitHub Actions
- Windows-native SSH tooling beyond Git Bash + MSYS2
