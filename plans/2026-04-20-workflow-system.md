# Iterative Feature Workflow System 闁?Implementation Plan

> **Architecture revision (2026-04-21):** the canonical workflow implementation
> lives in `.agents/skills/workflow/`. Claude should consume that shared source
> through local links created by `pnpm workflow:link-claude`, which hard-links
> `.claude/commands/*.md` to `.agents/skills/workflow/references/commands/*.md`
> and junction-links `.claude/skills/workflow/` to `.agents/skills/workflow/`.
> Codex invokes the shared workflow explicitly via `$workflow ...`, with
> optional UI metadata in `.agents/skills/workflow/agents/openai.yaml`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable shared workflow described in `docs/superpowers/specs/2026-04-20-workflow-system-design.md` so Claude slash-command wrappers and explicit Codex skill invocation both route into one shared workflow implementation plus state files under `docs/workflow/`, letting features advance through Design -> Code -> QA -> Integrate -> Promote with explicit human gates.

**Architecture:** Four layers. **(1) Claude slash-command wrappers** at `.claude/commands/` are thin entry points routing to shared command references. **(2) Claude bridge skill** at `.claude/skills/workflow/SKILL.md` redirects Claude into the shared implementation. **(3) One shared skill** at `.agents/skills/workflow/SKILL.md` plus command references under `references/commands/` and per-stage reference files under `stages/` holds all orchestration logic. **(4) Plain markdown state** under `docs/workflow/` is the single source of truth for in-flight work. The only non-markdown implementation file is the optional Codex metadata at `.agents/skills/workflow/agents/openai.yaml`.

**Tech Stack:** Markdown only. Claude Code skill and commands frontmatter syntax. Git for branch/merge operations. Bash for SSH/rsync during Bootstrap. No npm packages added.

---

## File Structure

**To create:**
- `.claude/commands/feature.md` - `/feature` intake wrapper
- `.claude/commands/wf-status.md` - `/wf-status` dashboard wrapper
- `.claude/commands/wf-run.md` - `/wf-run <chunk-id> [-a]` stage-runner wrapper
- `.claude/commands/wf-advance.md` - approve -> next stage wrapper
- `.claude/commands/wf-reject.md` - redo with feedback wrapper
- `.claude/commands/wf-blocked.md` - pause chunk wrapper
- `.claude/commands/wf-promote.md` - preproduction -> main wrapper
- `.claude/commands/wf-bootstrap.md` - one-shot server setup wrapper
- `.claude/skills/workflow/SKILL.md` - Claude bridge into the shared workflow
- `.agents/skills/workflow/SKILL.md` - shared orchestrator (dispatch + shared rules)
- `.agents/skills/workflow/agents/openai.yaml` - explicit-only Codex metadata
- `.agents/skills/workflow/references/commands/feature.md` - shared feature intake logic
- `.agents/skills/workflow/references/commands/wf-status.md` - shared status logic
- `.agents/skills/workflow/references/commands/wf-run.md` - shared stage-runner logic
- `.agents/skills/workflow/references/commands/wf-advance.md` - shared advance logic
- `.agents/skills/workflow/references/commands/wf-reject.md` - shared rejection logic
- `.agents/skills/workflow/references/commands/wf-blocked.md` - shared blocked logic
- `.agents/skills/workflow/references/commands/wf-promote.md` - shared promote logic
- `.agents/skills/workflow/references/commands/wf-bootstrap.md` - shared bootstrap logic
- `.agents/skills/workflow/stages/design.md` - Design stage logic
- `.agents/skills/workflow/stages/code.md` - Code stage logic
- `.agents/skills/workflow/stages/qa.md` - QA stage logic
- `.agents/skills/workflow/stages/integrate.md` - Integrate stage logic
- `.agents/skills/workflow/stages/promote.md` - Promote stage logic
- `.agents/skills/workflow/stages/bootstrap.md` - Bootstrap stage logic
- `.agents/skills/workflow/templates/feature.md` - feature.md template
- `.agents/skills/workflow/templates/tree.md` - tree file template
- `.agents/skills/workflow/templates/log.md` - log file template
- `.agents/skills/workflow/templates/INDEX-feature.md` - feature INDEX template
- `docs/workflow/README.md` - LLM navigation guide
- `docs/workflow/INDEX.md` - empty root dashboard

**To modify (additively, do not clobber existing entries):**
- `.gitignore` - add `.env.deploy.local`
- `.claude/settings.json` - add permission allowlist for workflow commands

---

## Task 1: Scaffold base folders, gitignore, and permission allowlist

**Files:**
- Create (empty dirs): `docs/workflow/`, `docs/workflow/features/`, `docs/workflow/archive/`, `.claude/commands/`, `.claude/skills/workflow/`, `.agents/skills/workflow/`, `.agents/skills/workflow/agents/`, `.agents/skills/workflow/references/commands/`, `.agents/skills/workflow/stages/`, `.agents/skills/workflow/templates/`
- Modify: `.gitignore` (append one line)
- Modify: `.claude/settings.json` (merge permission allowlist)

- [ ] **Step 1: Create folder skeleton with .gitkeep placeholders**

```bash
mkdir -p docs/workflow/features docs/workflow/archive \
         .claude/commands .claude/skills/workflow \
         .agents/skills/workflow/agents \
         .agents/skills/workflow/references/commands \
         .agents/skills/workflow/stages .agents/skills/workflow/templates
touch docs/workflow/features/.gitkeep docs/workflow/archive/.gitkeep
```

- [ ] **Step 2: Verify folders exist**

```bash
ls -d docs/workflow docs/workflow/features docs/workflow/archive \
      .claude/commands .claude/skills/workflow \
      .agents/skills/workflow/agents \
      .agents/skills/workflow/references/commands \
      .agents/skills/workflow/stages .agents/skills/workflow/templates
```

Expected: all listed paths print without errors.

- [ ] **Step 3: Append `.env.deploy.local` to `.gitignore`**

Read `.gitignore` first. If `.env.deploy.local` is not already listed, append:

```
# Workflow - local deploy credentials, never commit
.env.deploy.local
```

- [ ] **Step 4: Verify gitignore entry**

```bash
grep -c "^\.env\.deploy\.local$" .gitignore
```

Expected output: `1`

- [ ] **Step 5: Merge permission allowlist into `.claude/settings.json`**

Read `.claude/settings.json` if it exists. Merge the following into the `permissions.allow` array, preserving any existing entries. If the file does not exist, create it with this exact content:

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(pnpm *)",
      "Bash(gh *)",
      "Bash(docker *)",
      "Bash(docker compose *)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(rsync *)",
      "Bash(ssh-copy-id *)",
      "Bash(ssh-keygen *)",
      "Bash(ssh-keyscan *)",
      "mcp__desktop-commander__start_process",
      "mcp__desktop-commander__interact_with_process",
      "mcp__chrome-devtools__*"
    ]
  }
}
```

- [ ] **Step 6: Verify settings.json parses as valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add .gitignore .claude/settings.json docs/workflow/features/.gitkeep docs/workflow/archive/.gitkeep
git commit -m "chore(workflow): scaffold folders, gitignore, permission allowlist"
```

---

## Task 2: Write `docs/workflow/README.md` (LLM navigation guide)

**Files:**
- Create: `docs/workflow/README.md`

- [ ] **Step 1: Write the file**

Create `docs/workflow/README.md` with this exact content:

````markdown
# Workflow System

This folder holds state for an iterative feature workflow driven by Claude Code slash commands. Any LLM (Sonnet, GPT, Gemini, etc.) should be able to navigate this folder without prior context.

## Navigation

1. **Active features** 闁?read `INDEX.md` (this folder's root).
2. **Feature detail** 闁?open `features/<feature-id>/INDEX.md`. That file is the authoritative chunk state table for one feature.
3. **Tree detail** 闁?open `features/<feature-id>/trees/<tree>.md`. Holds tree goal, chunk specs, per-chunk state inline.
4. **What happened** 闁?open the matching log in `features/<feature-id>/logs/<tree>.log.md`.
5. **Completed work** 闁?`archive/YYYY-QQ/`. Read-only.

## Conventions

- **Chunk ID:** `<feature-slug>/<tree>/<NN-slug>` 闁?e.g. `2026-04-20-homepage-refactor/A-hero/01-hero-layout`.
- **Branch name:** `wf/<feature-slug>/<tree>/<NN>`.
- **Stages (enum):** `Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`.
- All files are plain markdown with tables. No custom syntax.

## State change rule

- State changes are made via slash commands (`/feature`, `/wf-run`, `/wf-advance`, `/wf-reject`, `/wf-blocked`, `/wf-promote`, `/wf-bootstrap`), never by hand-editing.
- The only exception: `/wf-blocked <reason>` may result in a free-text note being appended to the log.

## Conflict resolution

If `INDEX.md` and a log file disagree about a chunk's stage, **the log is authoritative**. Reconcile by updating INDEX to match the log.

## Archive rule

Never edit anything under `archive/`. Archived features are frozen history.
````

- [ ] **Step 2: Verify file has required sections**

```bash
grep -c "^## \(Navigation\|Conventions\|State change rule\|Conflict resolution\|Archive rule\)$" docs/workflow/README.md
```

Expected output: `5`

- [ ] **Step 3: Commit**

```bash
git add docs/workflow/README.md
git commit -m "docs(workflow): add navigation guide README"
```

---

## Task 3: Write `docs/workflow/INDEX.md` (empty root dashboard)

**Files:**
- Create: `docs/workflow/INDEX.md`

- [ ] **Step 1: Write the file**

Create `docs/workflow/INDEX.md` with this exact content:

````markdown
# Workflow Dashboard

Read `README.md` first if unfamiliar with this system.

## Active features

| Feature | Type | Created | Description | Progress | INDEX |
|---|---|---|---|---|---|

<!-- One row per active feature. Added by /feature, removed by /wf-promote. -->

## Archived

See `archive/`.
````

- [ ] **Step 2: Verify file has the dashboard table header**

```bash
grep -c "^| Feature | Type | Created | Description | Progress | INDEX |$" docs/workflow/INDEX.md
```

Expected output: `1`

- [ ] **Step 3: Commit**

```bash
git add docs/workflow/INDEX.md
git commit -m "docs(workflow): add root INDEX dashboard"
```

---

## Task 4: Write state file templates

**Files:**
- Create: `.agents/skills/workflow/templates/feature.md`
- Create: `.agents/skills/workflow/templates/tree.md`
- Create: `.agents/skills/workflow/templates/log.md`
- Create: `.agents/skills/workflow/templates/INDEX-feature.md`

- [ ] **Step 1: Write `templates/feature.md`**

````markdown
# Feature: {{FEATURE_TITLE}}

**ID:** {{FEATURE_ID}}
**Type:** {{TYPE}}
**Created:** {{DATE}}
**Description:** {{DESCRIPTION}}

## Motivation

{{MOTIVATION}}

## Tree plan

{{TREE_PLAN}}

<!-- Tree plan is a bulleted list:
- A-<tree-slug> 闁?<goal>: <chunks list>
- B-<tree-slug> 闁?...
-->

## Decisions log

- {{DATE}} 闁?feature intake approved by user.
````

- [ ] **Step 2: Write `templates/tree.md`**

````markdown
# Tree {{TREE_ID}}: {{TREE_TITLE}}

**Feature:** {{FEATURE_ID}}
**Goal:** Build the reusable shared workflow described in `docs/superpowers/specs/2026-04-20-workflow-system-design.md` so Claude slash-command wrappers and explicit Codex skill invocation both route into one shared workflow implementation plus state files under `docs/workflow/`, letting features advance through Design -> Code -> QA -> Integrate -> Promote with explicit human gates.
**Status:** {{TREE_STATUS}}

## Chunks

### 01-{{CHUNK_SLUG}}

- **Stage:** Pending
- **Branch:** 闁?- **Description:** {{CHUNK_DESCRIPTION}}
- **Acceptance criteria:**
  - {{ACCEPTANCE_1}}
  - {{ACCEPTANCE_2}}
- **Design notes:** (filled by Design stage)
- **Implementation summary:** (filled after Integrate)

<!-- Add more chunk sections as needed. Chunks run in order by prefix. -->
````

- [ ] **Step 3: Write `templates/log.md`**

````markdown
# Tree {{TREE_ID}} 闁?Log

Chronological stage transitions and decisions for all chunks in this tree.

## {{DATE}} 闁?01-{{CHUNK_SLUG}} 闁?Pending 闁?Design

Notes: tree created.
````

- [ ] **Step 4: Write `templates/INDEX-feature.md`**

````markdown
# Feature: {{FEATURE_TITLE}}

**Type:** {{TYPE}}
**Created:** {{DATE}}
**Status:** In progress
**Description:** {{DESCRIPTION}}

## State

| Tree | Chunk | Description | Stage | Branch | Updated |
|---|---|---|---|---|---|

<!-- One row per chunk. Updated by /wf-run, /wf-advance, /wf-reject, /wf-blocked. -->

## Links

- [Feature spec](feature.md)
- [Trees](trees/)
- [Logs](logs/)
````

- [ ] **Step 5: Verify all four template files exist**

```bash
ls .agents/skills/workflow/templates/feature.md \
   .agents/skills/workflow/templates/tree.md \
   .agents/skills/workflow/templates/log.md \
   .agents/skills/workflow/templates/INDEX-feature.md
```

Expected: all four paths listed.

- [ ] **Step 6: Commit**

```bash
git add .agents/skills/workflow/templates/
git commit -m "feat(workflow): add state file templates"
```

---

## Task 5: Write shared `SKILL.md`, Claude bridge skill, and Codex metadata

**Files:**
- Create: `.agents/skills/workflow/SKILL.md`
- Create: `.agents/skills/workflow/agents/openai.yaml`
- Create: `.claude/skills/workflow/SKILL.md`

- [ ] **Step 1: Write the shared orchestrator**

Create `.agents/skills/workflow/SKILL.md` as the canonical workflow implementation. It must:

- expose the `workflow` skill name
- state that it is used by explicit Codex invocation (`$workflow ...`) and by Claude wrappers
- treat `.agents/skills/workflow/` as the source of truth
- dispatch shared command behavior from `references/commands/`
- dispatch stage behavior from `stages/`
- point templates at `.agents/skills/workflow/templates/`
- define state files, handoff format, preflight checks, error recovery, and cleanup policy

- [ ] **Step 2: Add explicit-only Codex metadata**

Create `.agents/skills/workflow/agents/openai.yaml` with:

```yaml
interface:
  display_name: "Workflow"
  short_description: "Explicit shared feature workflow runner"
  default_prompt: "Use $workflow to run the shared feature workflow for this repository."

policy:
  allow_implicit_invocation: false
```

- [ ] **Step 3: Write the Claude bridge skill**

Create `.claude/skills/workflow/SKILL.md` as a thin bridge that:

- keeps the `workflow` skill name for Claude compatibility
- tells Claude to read `.agents/skills/workflow/SKILL.md`
- explicitly forbids maintaining a second full workflow implementation under `.claude/skills/workflow/`

- [ ] **Step 4: Verify shared skill, bridge, and metadata**

```bash
head -4 .agents/skills/workflow/SKILL.md | grep -c "^name: workflow$"
grep -c "Codex explicit invocation" .agents/skills/workflow/SKILL.md
grep -c "references/commands" .agents/skills/workflow/SKILL.md
grep -c "allow_implicit_invocation: false" .agents/skills/workflow/agents/openai.yaml
grep -c ".agents/skills/workflow/SKILL.md" .claude/skills/workflow/SKILL.md
```

Expected: `1` for each.

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/workflow/SKILL.md \
        .agents/skills/workflow/agents/openai.yaml \
        .claude/skills/workflow/SKILL.md
git commit -m "feat(workflow): add shared workflow skill and adapters"
```

---

## Task 6: Write Design stage reference

**Files:**
- Create: `.agents/skills/workflow/stages/design.md`

- [ ] **Step 1: Write the file**

````markdown
# Design Stage

**Handoff:** always human-gate. `-a` does NOT auto-approve Design.

## What this stage does

Produces a mockup + design spec for the chunk, aligned with existing design tokens and patterns.

## Steps

1. Read the chunk section from `docs/workflow/features/<feature-id>/trees/<tree>.md` 闁?pull description + acceptance criteria.
2. Read `graphify-out/GRAPH_REPORT.md` if present to understand existing UI modules + patterns.
3. Invoke the `ui-ux-pro-max` skill with the chunk's description and acceptance criteria.
4. Receive the design output (mockup description, component breakdown, token references).
5. Append a **Design notes** subsection to the chunk's section in the tree file. Include: mockup description, component structure, design tokens referenced, interaction notes.
6. Do NOT write code yet. Do NOT create or modify any `.tsx` / `.ts` / `.css` files.
7. Append to the tree log: stage transition + summary of design decisions.
8. Update `features/<feature-id>/INDEX.md`: this chunk's stage 闁?`Design` (still Design, with design notes attached), updated timestamp.
9. Create the chunk branch `wf/<feature>/<tree>/<NN>` if it does not exist; commit the tree file and log change on that branch.
10. Print the handoff block with `Gate: 闁翠礁宕?and wait for user `/wf-advance` or `/wf-reject`.

## Gate checklist

- [ ] Mockup produced by `ui-ux-pro-max`.
- [ ] Only references existing design tokens (no new tokens unless the gate is a deliberate design-system extension 闁?flag it in the handoff).
- [ ] All acceptance criteria are addressed by the design.
- [ ] Design notes written into the tree file.
- [ ] Changes committed to the chunk branch.

## Rejection path

If the user runs `/wf-reject <note>`: append the note to the log, leave chunk at Design, clear the Design notes subsection (do not keep stale design). Next `/wf-run` redoes Design with the feedback in context.
````

- [ ] **Step 2: Verify file exists and has gate checklist**

```bash
grep -c "^## Gate checklist$" .agents/skills/workflow/stages/design.md
```

Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/workflow/stages/design.md
git commit -m "feat(workflow): add Design stage reference"
```

---

## Task 7: Write Code stage reference

**Files:**
- Create: `.agents/skills/workflow/stages/code.md`

- [ ] **Step 1: Write the file**

````markdown
# Code Stage

**Handoff:** auto 闁?QA on gate pass. Machine-checked.

## What this stage does

Implements the chunk on its branch using TDD. Must follow the approved Design notes.

## Required skills

- `superpowers:test-driven-development` 闁?enforce red 闁?green 闁?refactor.
- `vercel-react-best-practices` 闁?consult for React/Next.js patterns (this project is Next.js 14 App Router + Ant Design 6 + Tailwind 4 + Zustand).

## Steps

1. Preflight: ensure you are on the chunk branch `wf/<feature>/<tree>/<NN>` with a clean working tree.
2. Read the chunk section (including approved Design notes) from the tree file.
3. Follow TDD for each acceptance criterion:
   a. Write the failing test first.
   b. Run it to verify it fails.
   c. Write the minimal implementation.
   d. Run it to verify it passes.
   e. Refactor if needed.
   f. Commit (small commits, one per criterion).
4. Follow project rules from `CLAUDE.md` and memory:
   - HTTP: `useRequest` from `@/hooks` (never raw `fetch`).
   - Time: `useRelativeTime` from `@/hooks/time` (never `dayjs().fromNow()`).
   - API routes: cast params inside `createGlobalHandler` (no specific `RouteContext<T>` annotation).
5. After all acceptance criteria pass, run the gate checks below.
6. If gate passes, auto-advance to QA stage.
7. If gate fails, STOP. Print handoff with `Gate: 闁村倸鐣? list failures, wait for `/wf-reject`.

## Gate checklist

Run these commands in order. All must pass. If any fails, STOP.

- [ ] `pnpm test` 闁?all tests pass.
- [ ] `pnpm type-check` 闁?zero type errors.
- [ ] `pnpm lint` 闁?zero lint errors.

## `-a` mode subagent dispatch

When `/wf-run <chunk-id> -a` reaches a new chunk's Code stage:

1. Dispatch a fresh subagent via the `Agent` tool.
2. The subagent prompt MUST be self-contained: include the chunk's description, acceptance criteria, approved design notes, and the TDD rule.
3. The subagent runs the Code stage to gate.
4. Receive result. Update state files.
5. Do NOT reuse the subagent for the next chunk 闁?start fresh.
6. If the subagent reports failure or crashes, mark this chunk Failed, stop `-a`, print handoff with `Gate: 闁村倸鐣?

## Rejection path

If the user runs `/wf-reject <note>` during Code stage review (e.g., after QA bubbles back code concerns): append note to log, leave chunk at Code, do NOT revert commits automatically. Next `/wf-run` addresses the note with the existing code as starting point.
````

- [ ] **Step 2: Verify file has subagent section**

```bash
grep -c "^## \`-a\` mode subagent dispatch$" .agents/skills/workflow/stages/code.md
```

Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/workflow/stages/code.md
git commit -m "feat(workflow): add Code stage reference"
```

---

## Task 8: Write QA stage reference

**Files:**
- Create: `.agents/skills/workflow/stages/qa.md`

- [ ] **Step 1: Write the file**

````markdown
# QA Stage

**Handoff:** auto 闁?Integrate on gate pass. Machine-checked.

## What this stage does

Runs end-to-end tests, visual regression, and console/network error checks against the chunk's code on its branch.

## Required tools

- `pnpm test:e2e` 闁?Playwright test runner (if not present, create a minimal Playwright setup as part of this chunk OR propose adding it and block).
- `mcp__chrome-devtools__*` 闁?for console + network scanning.
- Visual baseline store: `tests/visual-baseline/` (created on first chunk; each chunk has its own baseline images named by chunk ID).

## Steps

1. Preflight: on chunk branch, working tree clean.
2. Start the project's dev server (if not running). Note the URL.
3. Run Playwright E2E tests scoped to the chunk's routes:
   `pnpm test:e2e --grep "<chunk-slug>"`
4. If a chunk-scoped test does not exist yet, create one based on the chunk's acceptance criteria, then run it. Commit the test.
5. Capture screenshots of the chunk's routes using `mcp__chrome-devtools__take_screenshot`. Save to `tests/visual-baseline/<chunk-id>/`.
6. If a baseline already exists, diff against it. If this is the first run, prompt the user to approve the new baseline (STOP with `Gate: 闁冲鐝? or reject to fix UI first.
7. Scan console + network logs using `mcp__chrome-devtools__list_console_messages` and `mcp__chrome-devtools__list_network_requests`. Require zero errors or failed requests.
8. Append QA report to the tree log: test counts, baseline status, error counts, screenshot paths.
9. Run the gate checklist. If passes, auto-advance to Integrate.

## Gate checklist

- [ ] `pnpm test:e2e --grep "<chunk-slug>"` 闁?all relevant tests pass.
- [ ] Visual regression: either baseline matches, or new baseline approved by user.
- [ ] Zero console errors (`list_console_messages` severity error/warning = 0).
- [ ] Zero failed network requests (any 4xx/5xx on the chunk's routes).

## First QA run baseline prompt

When a chunk has no existing visual baseline:

1. Capture screenshots.
2. Print them in the handoff with `Gate: 闁冲鐝?
3. Ask the user: "Approve this as the visual baseline for `<chunk-id>`? Reply `/wf-advance` to approve and proceed to Integrate. Reply `/wf-reject <note>` to redo Code stage."
4. On approval, save baseline and advance.

## Rejection path

`/wf-reject <note>` during QA: append note to log, route chunk back to Code stage (not Design). Clear the new baseline if one was created in this run.
````

- [ ] **Step 2: Verify gate checklist present**

```bash
grep -c "^## Gate checklist$" .agents/skills/workflow/stages/qa.md
```

Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/workflow/stages/qa.md
git commit -m "feat(workflow): add QA stage reference"
```

---

## Task 9: Write Integrate stage reference

**Files:**
- Create: `.agents/skills/workflow/stages/integrate.md`

- [ ] **Step 1: Write the file**

````markdown
# Integrate Stage

**Handoff:** always human-gate 闁?stops after preproduction is pushed so the user can review.

## What this stage does

Merges the chunk branch into `preproduction`, runs a cross-chunk duplication review, pushes, and cleans up the chunk branch.

## Steps

1. Preflight: chunk's QA gate passed, on chunk branch, working tree clean.
2. Fetch and checkout `preproduction` (create from `main` if absent, first time only).
3. Rebase the chunk branch onto `preproduction`:
   `git rebase preproduction` (from the chunk branch)
4. If rebase produces a conflict, STOP. Print the list of conflicting files in the handoff with `Gate: 闁冲鐝? Never auto-resolve. User resolves, then reruns `/wf-run`.
5. Merge the rebased chunk branch into `preproduction`:
   `git checkout preproduction && git merge --no-ff wf/<feature>/<tree>/<NN>`
6. Run the gate checks on preproduction (tests + type-check + lint must still be green after merge).
7. **Cross-chunk duplication review:**
   a. Identify files touched by this chunk.
   b. Identify files touched by this feature's other chunks already merged into `preproduction` (`git log preproduction --name-only --grep="<feature-id>"`).
   c. For files in the intersection, scan for duplicated logic between this chunk's additions and the prior merges.
   d. If duplication is found, STOP with `Gate: 闁冲鐝?and present three options in the handoff:
      - **Extract now** 闁?refactor the duplication into a shared helper/hook as part of this chunk. User replies `extract` and you execute.
      - **Defer to mini-refactor chunk** 闁?create a new chunk in this tree (or a new tree, user's call) and continue. User replies `defer`.
      - **Document-and-ignore** 闁?add a note to the log explaining why extraction is not warranted. User replies `ignore <reason>`.
   e. Only continue past this step after the duplication question is resolved.
8. Push preproduction to origin: `git push origin preproduction`.
9. Delete the chunk branch locally and remotely:
   `git branch -d wf/<feature>/<tree>/<NN>`
   `git push origin --delete wf/<feature>/<tree>/<NN>`
10. In the tree file, collapse this chunk's section: remove in-progress artifacts, leave a one-line summary + link to the log entry.
11. Update `features/<feature-id>/INDEX.md`: chunk stage 闁?`Done` (for that chunk) or `Awaiting-Promote` (if it was the last chunk in the feature).
12. If all chunks in a tree now show `Done`, update the tree file header to `Awaiting-Promote`.
13. Append to log: Integrate complete, duplication decision, push commit hash.
14. Print handoff with `Gate: 闁翠礁宕?and instruct the user to review preproduction before running `/wf-promote <feature-id>`.

## Gate checklist

- [ ] Rebase clean.
- [ ] Merge into preproduction successful (no conflicts).
- [ ] Tests + type-check + lint green on preproduction after merge.
- [ ] Cross-chunk duplication reviewed: extracted, deferred, or documented.
- [ ] preproduction pushed to origin.
- [ ] Chunk branch deleted.
- [ ] Tree file and INDEX updated.

## Rejection path

`/wf-reject <note>` at Integrate: this is rare (the merge is already done). If used, the user must specify whether to revert the merge (which revert commit to create) or leave it and flag for later. Append note to log either way.
````

- [ ] **Step 2: Verify duplication review section present**

```bash
grep -c "^7\. \*\*Cross-chunk duplication review:\*\*$" .agents/skills/workflow/stages/integrate.md
```

Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/workflow/stages/integrate.md
git commit -m "feat(workflow): add Integrate stage reference"
```

---

## Task 10: Write Promote stage reference

**Files:**
- Create: `.agents/skills/workflow/stages/promote.md`

- [ ] **Step 1: Write the file**

````markdown
# Promote Stage

**Triggered by:** `/wf-promote <feature-id>` 闁?explicit user command only. Never auto-promotes.

## What this stage does

Merges `preproduction` 闁?`main`, pushes, lets the server's CI/CD auto-deploy, verifies, tags, archives the feature folder.

## Preconditions

- The feature's INDEX shows all chunks at `Done` or `Awaiting-Promote`.
- `preproduction` contains all chunk merges for this feature.
- `.env.deploy.local` exists for the project (Bootstrap has run at least once for this app).

If any precondition fails, STOP with `Gate: 闁冲鐝?and explain.

## Steps

1. Preflight: clean working tree; on any branch (will switch).
2. `git checkout main`.
3. `git pull origin main` 闁?ensure up to date.
4. `git merge --no-ff preproduction -m "promote: <feature-id>"` 闁?merge preproduction into main.
5. If conflict, STOP. Never auto-resolve.
6. `git push origin main` 闁?triggers server-side CI/CD auto-deploy.
7. Invoke the `deployment-status-check` skill to poll GitHub Actions for green deploy.
8. If deploy fails: STOP with `Gate: 闁村倸鐣? Link the failing workflow run. Do NOT retry 闁?user investigates.
9. Smoke-check live app via `mcp__chrome-devtools__navigate_page` to the feature's public routes. Verify HTTP 200 + zero console errors.
10. Tag the main commit: `git tag feature/<feature-id>-done && git push origin --tags`.
11. Delete any lingering `wf/<feature>/*` branches (local + remote).
12. Archive the feature folder: move `docs/workflow/features/<feature-id>/` 闁?`docs/workflow/archive/<YYYY-QQ>/<feature-id>/`. Use `YYYY-QQ` based on today's date (e.g. 2026-04-20 闁?`2026-Q2`).
13. Remove the feature's row from `docs/workflow/INDEX.md`.
14. Commit the archive move: `git add -A && git commit -m "archive: <feature-id>"`.
15. Push: `git push origin main`.
16. Print handoff with `Gate: 闁翠礁宕?and a summary: feature ID, commit SHA, tag, live URL, archive path.

## Gate checklist

- [ ] All chunks `Done` before starting.
- [ ] Main merge clean.
- [ ] Main push succeeded.
- [ ] `deployment-status-check` reports green.
- [ ] Smoke check HTTP 200 + zero console errors.
- [ ] Tag pushed.
- [ ] Feature folder archived.
- [ ] Root INDEX row removed.

## Rollback

If the smoke check fails after deploy:

1. STOP.
2. Inform user and present options:
   a. Revert the promote commit on main and re-push (`git revert HEAD --no-edit && git push`).
   b. Fix forward (user creates a hotfix chunk under this feature, works through stages, promotes again).
3. Do NOT auto-revert. User picks.
````

- [ ] **Step 2: Verify rollback section present**

```bash
grep -c "^## Rollback$" .agents/skills/workflow/stages/promote.md
```

Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/workflow/stages/promote.md
git commit -m "feat(workflow): add Promote stage reference"
```

---

## Task 11: Write Bootstrap stage reference

**Files:**
- Create: `.agents/skills/workflow/stages/bootstrap.md`

- [ ] **Step 1: Write the file**

````markdown
# Bootstrap Stage

**Triggered by:** `/wf-bootstrap <app-name>` 闁?one-shot per app. Skip if `.env.deploy.local` already exists and CI workflow is already registered.

## What this stage does

Provisions a brand-new app's deploy pipeline: SSH key onto server, docker + nginx configs, GitHub Actions workflow for auto-deploy on main push.

## Preconditions

- `gh` CLI installed and authenticated (`gh auth status`).
- User has SSH access credentials to the target server (IP + user + port; password only needed once).
- User has paste-ready credentials in a gitignored file, NOT in chat.

## Steps

### 1. Collect credentials (do NOT ask user to paste password in chat)

1. Check if `.env.deploy.local` exists. If yes, read it.
2. If missing or incomplete, instruct the user:
   > "Create/edit `.env.deploy.local` at the project root with these lines:
   > ```
   > DEPLOY_HOST=<server-ip-or-hostname>
   > DEPLOY_USER=<ssh-user>
   > DEPLOY_PORT=22
   > DEPLOY_APP_PATH=/srv/<app-name>
   > DEPLOY_PASSWORD=<password-for-first-run-only>
   > ```
   > Reply `done` when saved. I will read the file and never echo it."
3. Wait for the user to confirm. Then read `.env.deploy.local` and parse values.

### 2. Generate deploy key (Ed25519) if absent

```bash
KEY_PATH=~/.ssh/<app-name>_deploy
test -f "$KEY_PATH" || ssh-keygen -t ed25519 -C "<app-name>-deploy" -N "" -f "$KEY_PATH"
```

### 3. Install the public key on the server (one-time, needs password)

Use `mcp__desktop-commander__start_process` + `interact_with_process` to run `ssh-copy-id` and respond to the password prompt interactively:

```bash
ssh-copy-id -i "$KEY_PATH.pub" -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST"
```

When the process prompts for the password, send `$DEPLOY_PASSWORD` via `interact_with_process`.

If `ssh-copy-id` fails, STOP with `Gate: 闁村倸鐣? Print the error. The user must investigate before retrying 闁?do NOT loop.

### 4. Verify key-only auth

```bash
ssh -o PasswordAuthentication=no -i "$KEY_PATH" -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "echo ok"
```

Expected output: `ok`. If not, STOP.

### 5. Purge the password from `.env.deploy.local`

Instruct user:
> "Key auth verified. Please remove the `DEPLOY_PASSWORD=...` line from `.env.deploy.local` now. Reply `done` when removed."

Wait. Then re-read the file and confirm the line is gone.

### 6. Add SSH config entry

Append to `~/.ssh/config` (create if missing):

```
Host <app-name>-deploy
    HostName <DEPLOY_HOST>
    User <DEPLOY_USER>
    Port <DEPLOY_PORT>
    IdentityFile <KEY_PATH>
    PreferredAuthentications publickey
```

### 7. Provision server-side resources

```bash
ssh <app-name>-deploy "mkdir -p $DEPLOY_APP_PATH && sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin nginx"
```

Skip packages already installed.

### 8. Sync initial configs

Prepare local `deploy/docker-compose.yml` and `deploy/nginx.conf` (if not already in the project). Reference `context7` for current best practices if unsure of syntax.

```bash
rsync -avzP ./deploy/ <app-name>-deploy:$DEPLOY_APP_PATH/
```

### 9. Create GitHub Actions workflow for auto-deploy

Create `.github/workflows/deploy.yml` with an SSH-based deploy job that triggers on push to `main`. Use `context7` for current canonical action versions.

Store the private key as a repo secret:

```bash
gh secret set DEPLOY_SSH_KEY < $KEY_PATH
gh secret set DEPLOY_HOST --body "$DEPLOY_HOST"
gh secret set DEPLOY_USER --body "$DEPLOY_USER"
gh secret set DEPLOY_PORT --body "$DEPLOY_PORT"
gh secret set DEPLOY_APP_PATH --body "$DEPLOY_APP_PATH"
```

Commit the workflow file:

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(deploy): add main-branch auto-deploy workflow"
git push origin main
```

### 10. Verify the CI workflow registered

Invoke the `deployment-status-check` skill. Expect it to find the new workflow and report the first run's status.

### 11. Write `DEPLOY.md`

At project root, create/overwrite `DEPLOY.md`:

````markdown
# Deploy

## Quick connect

```bash
ssh <app-name>-deploy
```

## Auto-deploy

Pushes to `main` trigger `.github/workflows/deploy.yml` which SSHs to the server and runs `docker compose pull && docker compose up -d`.

## Rollback

```bash
ssh <app-name>-deploy "cd $DEPLOY_APP_PATH && docker compose down && git checkout HEAD~1 && docker compose up -d"
```

## Credentials

Config lives in `~/.ssh/config` under `Host <app-name>-deploy`. `.env.deploy.local` holds non-secret deploy metadata (the actual SSH key is at `~/.ssh/<app-name>_deploy`). GitHub Actions uses repo secrets `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_APP_PATH`.
````

Commit:

```bash
git add DEPLOY.md
git commit -m "docs(deploy): add deploy quick reference"
```

### 12. Final handoff

Print handoff with `Gate: 闁翠礁宕?and a summary: SSH alias, server path, CI workflow path, first-run status.

## Gate checklist

- [ ] Deploy key installed on server.
- [ ] Key-only auth verified (password auth explicitly disabled for the test).
- [ ] Password line removed from `.env.deploy.local`.
- [ ] SSH config entry added.
- [ ] Server-side docker + nginx ready.
- [ ] Initial configs synced.
- [ ] GitHub Actions workflow committed and registered.
- [ ] GitHub secrets set.
- [ ] `deployment-status-check` reports the workflow is live.
- [ ] `DEPLOY.md` written.

## Failure recovery

If step 3 (`ssh-copy-id`) fails:

1. STOP immediately.
2. Print the error verbatim.
3. Warn the user: "The password line is still in `.env.deploy.local`. Resolve the SSH issue manually, then delete the password line yourself. Do NOT rerun Bootstrap until you've removed the password."

Never loop retries on auth failures.
````

- [ ] **Step 2: Verify Bootstrap steps 1-12 present**

```bash
grep -c "^### \(1\. \|2\. \|3\. \|4\. \|5\. \|6\. \|7\. \|8\. \|9\. \|10\. \|11\. \|12\. \)" .agents/skills/workflow/stages/bootstrap.md
```

Expected: `12`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/workflow/stages/bootstrap.md
git commit -m "feat(workflow): add Bootstrap stage reference"
```

---

## Task 12: Write shared `feature` command reference and Claude wrapper

**Files:**
- Create: `.agents/skills/workflow/references/commands/feature.md`
- Create: `.claude/commands/feature.md`

- [ ] **Step 1: Write the shared reference**

Create `.agents/skills/workflow/references/commands/feature.md` with the real intake logic: parse args, read project context, propose a decomposition, scaffold the feature folder from templates on approval, update `docs/workflow/INDEX.md`, commit, and print the next runnable chunks.

- [ ] **Step 2: Write the Claude wrapper**

Create `.claude/commands/feature.md` as a thin wrapper that:

- preserves the existing frontmatter (`description` and `argument-hint`)
- notes that the user is invoking `/feature`
- says `This is a thin Claude wrapper.`
- reads `.agents/skills/workflow/references/commands/feature.md`
- treats `.agents/skills/workflow/` as the canonical source of truth

- [ ] **Step 3: Verify reference and wrapper**

```bash
grep -c "Handle the shared \`feature\` operation" .agents/skills/workflow/references/commands/feature.md
grep -c "This is a thin Claude wrapper." .claude/commands/feature.md
grep -c "references/commands/feature.md" .claude/commands/feature.md
```

Expected: `1` for each.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/workflow/references/commands/feature.md \
        .claude/commands/feature.md
git commit -m "feat(workflow): add shared feature command reference"
```

---

## Task 13: Write shared `wf-status` command reference and Claude wrapper

**Files:**
- Create: `.agents/skills/workflow/references/commands/wf-status.md`
- Create: `.claude/commands/wf-status.md`

- [ ] **Step 1: Write the shared reference**

Create `.agents/skills/workflow/references/commands/wf-status.md` with the read-only status behavior for root dashboard, active feature, and archived feature lookup.

- [ ] **Step 2: Write the Claude wrapper**

Create `.claude/commands/wf-status.md` as a thin wrapper that forwards to the shared reference file.

- [ ] **Step 3: Verify reference and wrapper**

```bash
grep -c "Handle the shared \`wf-status\` operation" .agents/skills/workflow/references/commands/wf-status.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-status.md
grep -c "references/commands/wf-status.md" .claude/commands/wf-status.md
```

Expected: `1` for each.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/workflow/references/commands/wf-status.md \
        .claude/commands/wf-status.md
git commit -m "feat(workflow): add shared wf-status command reference"
```

---

## Task 14: Write shared `wf-run` command reference and Claude wrapper

**Files:**
- Create: `.agents/skills/workflow/references/commands/wf-run.md`
- Create: `.claude/commands/wf-run.md`

- [ ] **Step 1: Write the shared reference**

Create `.agents/skills/workflow/references/commands/wf-run.md` with the current shared behavior: parse chunk args, run preflight checks, load chunk state, dispatch to stage references, and honor `-a` auto-advance rules.

- [ ] **Step 2: Write the Claude wrapper**

Create `.claude/commands/wf-run.md` as a thin wrapper that forwards to the shared reference file.

- [ ] **Step 3: Verify reference and wrapper**

```bash
grep -c "Handle the shared \`wf-run\` operation" .agents/skills/workflow/references/commands/wf-run.md
grep -c "\`-a\` auto-advance handling" .agents/skills/workflow/references/commands/wf-run.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-run.md
grep -c "references/commands/wf-run.md" .claude/commands/wf-run.md
```

Expected: `1` for each.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/workflow/references/commands/wf-run.md \
        .claude/commands/wf-run.md
git commit -m "feat(workflow): add shared wf-run command reference"
```

---

## Task 15: Write shared `wf-advance`, `wf-reject`, and `wf-blocked` references plus Claude wrappers

**Files:**
- Create: `.agents/skills/workflow/references/commands/wf-advance.md`
- Create: `.agents/skills/workflow/references/commands/wf-reject.md`
- Create: `.agents/skills/workflow/references/commands/wf-blocked.md`
- Create: `.claude/commands/wf-advance.md`
- Create: `.claude/commands/wf-reject.md`
- Create: `.claude/commands/wf-blocked.md`

- [ ] **Step 1: Write the shared references**

Create the three shared reference files with the actual shared behavior for:

- advancing the current chunk after approval
- rejecting the current stage with a note
- marking the current chunk blocked with a reason

- [ ] **Step 2: Write the Claude wrappers**

Create the three `.claude/commands/*.md` files as thin wrappers that forward to their matching shared references.

- [ ] **Step 3: Verify references and wrappers**

```bash
grep -c "pending handoff" .agents/skills/workflow/references/commands/wf-advance.md
grep -c "REJECTED at <stage>" .agents/skills/workflow/references/commands/wf-reject.md
grep -c "BLOCKED" .agents/skills/workflow/references/commands/wf-blocked.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-advance.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-reject.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-blocked.md
```

Expected: `1` for each.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/workflow/references/commands/wf-advance.md \
        .agents/skills/workflow/references/commands/wf-reject.md \
        .agents/skills/workflow/references/commands/wf-blocked.md \
        .claude/commands/wf-advance.md \
        .claude/commands/wf-reject.md \
        .claude/commands/wf-blocked.md
git commit -m "feat(workflow): add shared advance reject blocked command references"
```

---

## Task 16: Write shared `wf-promote` command reference and Claude wrapper

**Files:**
- Create: `.agents/skills/workflow/references/commands/wf-promote.md`
- Create: `.claude/commands/wf-promote.md`

- [ ] **Step 1: Write the shared reference**

Create `.agents/skills/workflow/references/commands/wf-promote.md` with the promote preconditions and stage handoff into `.agents/skills/workflow/stages/promote.md`.

- [ ] **Step 2: Write the Claude wrapper**

Create `.claude/commands/wf-promote.md` as a thin wrapper that forwards to the shared reference file.

- [ ] **Step 3: Verify reference and wrapper**

```bash
grep -c "stages/promote.md" .agents/skills/workflow/references/commands/wf-promote.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-promote.md
grep -c "references/commands/wf-promote.md" .claude/commands/wf-promote.md
```

Expected: `1` for each.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/workflow/references/commands/wf-promote.md \
        .claude/commands/wf-promote.md
git commit -m "feat(workflow): add shared wf-promote command reference"
```

---

## Task 17: Write shared `wf-bootstrap` command reference and Claude wrapper

**Files:**
- Create: `.agents/skills/workflow/references/commands/wf-bootstrap.md`
- Create: `.claude/commands/wf-bootstrap.md`

- [ ] **Step 1: Write the shared reference**

Create `.agents/skills/workflow/references/commands/wf-bootstrap.md` with the bootstrap preconditions, re-bootstrap confirmation rules, and stage handoff into `.agents/skills/workflow/stages/bootstrap.md`.

- [ ] **Step 2: Write the Claude wrapper**

Create `.claude/commands/wf-bootstrap.md` as a thin wrapper that forwards to the shared reference file.

- [ ] **Step 3: Verify reference and wrapper**

```bash
grep -c "stages/bootstrap.md" .agents/skills/workflow/references/commands/wf-bootstrap.md
grep -c "This is a thin Claude wrapper." .claude/commands/wf-bootstrap.md
grep -c "references/commands/wf-bootstrap.md" .claude/commands/wf-bootstrap.md
```

Expected: `1` for each.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/workflow/references/commands/wf-bootstrap.md \
        .claude/commands/wf-bootstrap.md
git commit -m "feat(workflow): add shared wf-bootstrap command reference"
```

---

## Task 18: End-to-end smoke dogfooding

**Files:**
- Temporarily create: `docs/workflow/features/2026-04-20-smoke-test/**` (will be deleted at end)

**Purpose:** validate the whole chain works against a throwaway feature before real use.

- [ ] **Step 1: Reload plugins so new commands and skill are visible**

In the Claude Code session, run `/reload-plugins` (local command).
Expected output: a line like `Reloaded: ... N skills 鐠?...` that includes the `workflow` skill count increased by 1.

- [ ] **Step 2: Invoke `/feature` with a throwaway description**

```
/feature smoke-test: verify workflow plumbing end-to-end --type refactor
```

Expected:
- Claude reads project context.
- Claude proposes a decomposition (even a trivial one-tree one-chunk decomposition is fine 闁?this is about plumbing, not real work).
- Claude asks for approval.

- [ ] **Step 3: Approve via chat, then verify folder created**

Reply to Claude: "approve".

After Claude scaffolds, verify:

```bash
ls docs/workflow/features/2026-04-20-smoke-test/
```

Expected: `INDEX.md feature.md logs/ trees/`

```bash
grep -c "2026-04-20-smoke-test" docs/workflow/INDEX.md
```

Expected: `1`

- [ ] **Step 4: Check `/wf-status` prints the root INDEX**

```
/wf-status
```

Expected: table output including the smoke-test row.

- [ ] **Step 5: Check `/wf-status 2026-04-20-smoke-test` prints feature INDEX**

```
/wf-status 2026-04-20-smoke-test
```

Expected: feature's state table with at least one Pending chunk.

- [ ] **Step 6: Invoke `/wf-run` on the first chunk and verify Design stage runs**

Find the chunk ID from the feature INDEX (something like `2026-04-20-smoke-test/A-xxx/01-xxx`).

```
/wf-run 2026-04-20-smoke-test/A-xxx/01-xxx
```

Expected:
- Preflight passes.
- Claude reads the Design stage reference.
- Claude invokes `ui-ux-pro-max` (or produces design notes some other way).
- Claude appends Design notes to the tree file.
- Claude prints the WORKFLOW HANDOFF block with `Gate: 闁翠礁宕?
- The tree file now has non-empty Design notes.

```bash
grep -c "Design notes:" docs/workflow/features/2026-04-20-smoke-test/trees/*.md
```

Expected: `>= 1`

- [ ] **Step 7: Reject the design and verify `/wf-reject` behaves**

```
/wf-reject not the vibe, try again
```

Expected:
- Log has a REJECTED entry with the note.
- Stage unchanged in INDEX (still Design).
- Design notes cleared from the tree file (per Design stage reference).

```bash
grep -c "REJECTED" docs/workflow/features/2026-04-20-smoke-test/logs/*.log.md
```

Expected: `>= 1`

- [ ] **Step 8: Clean up the smoke-test feature**

```bash
rm -rf docs/workflow/features/2026-04-20-smoke-test
```

Edit `docs/workflow/INDEX.md` and remove the smoke-test row.

Check no chunk branches remain:

```bash
git branch --list 'wf/2026-04-20-smoke-test/*'
```

Expected: empty. If any exist, delete: `git branch -D wf/2026-04-20-smoke-test/*` (with glob expansion handled by your shell).

- [ ] **Step 9: Commit cleanup**

```bash
git add docs/workflow/INDEX.md
git add -u  # stage the folder deletion
git commit -m "chore(workflow): remove smoke-test artifacts after E2E validation"
```

- [ ] **Step 10: Post-validation report**

Summarize to the user:
- Which stages were exercised (at minimum Design; others optional).
- Any rough edges found (commands that stalled, prompts that were unclear, state transitions that needed manual fixup).
- Whether the system is ready for the real first feature (the homepage refactor).

If rough edges were found, create follow-up tasks for them. Do NOT patch on the fly without a task 闁?the workflow is itself under the same rules it enforces.
