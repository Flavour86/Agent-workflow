---
name: wf-init
description: Initialize the workflow system by creating necessary basic folders and files.
disable-model-invocation: true
---

The user is invoking `/($)wf-init`.

Set up the `docs/workflow/` state directory so the workflow commands have a place to track features.

## Steps

### 1. Create folders

Ensure these directories exist:

```bash
mkdir -p docs/workflow/features docs/workflow/archive
```

Add `.gitkeep` placeholders so the empty folders are tracked by git:

```bash
touch docs/workflow/features/.gitkeep docs/workflow/archive/.gitkeep
```

### 2. Write `docs/workflow/README.md`

Skip if the file already exists and is non-empty.

Content:

```markdown
# Workflow System

This folder holds state for the iterative feature workflow. Any LLM can navigate it without prior context.

## Navigation

1. **Active features** — read `INDEX.md` (this file's sibling).
2. **Feature detail** — open `features/<feature-id>/INDEX.md`.
3. **Tree detail** — open `features/<feature-id>/trees/<tree>.md`.
4. **What happened** — open `features/<feature-id>/logs/<tree>.log.md`.
5. **Completed work** — `archive/YYYY-QQ/`. Read-only.

## Conventions

- **Feature ID:** `YYYY-MM-DD-<slug>` — e.g. `2026-04-20-homepage-refactor`.
- **Chunk ID:** `<feature-id>/<tree>/<NN-slug>` — e.g. `2026-04-20-homepage-refactor/A-hero/01-hero-layout`.
- **Branch name:** `wf/<feature-id>/<tree>/<NN>`.
- **Stages:** `Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`.
- All files are plain markdown. No custom syntax.

## State change rule

- State changes are made via commands (`feature`, `wf-run`,
  `wf-advance`, `wf-reject`, `wf-blocked`, `wf-promote`,
  `wf-bootstrap`), never by hand-editing.
- The only exception: `wf-blocked <reason>` may result in a free-text note
  being appended to the log.

## Conflict resolution

If `INDEX.md` and a log file disagree about a chunk's stage, stop and ask the user

## Archive rule

Never edit anything under `archive/`. Archived features are frozen history.
```

### 3. Write `docs/workflow/INDEX.md`

Skip if the file already exists and is non-empty.

Content:

```markdown
# Workflow Dashboard

Read `README.md` first if unfamiliar with this system.

## Active features

| Feature | Type | Created | Description | Progress | INDEX |
|---|---|---|---|---|---|

<!-- One row per active feature. Added by /feature, removed by /wf-promote. -->

## Archived

See `archive/`.
```

### 4. Verify

```bash
ls docs/workflow/README.md docs/workflow/INDEX.md \
   docs/workflow/features/.gitkeep docs/workflow/archive/.gitkeep
```

All four paths must print without error.

### 5. Commit

```bash
git add docs/workflow/
git commit -m "chore(workflow): initialise docs/workflow state folder"
```

If nothing was changed (all files already existed), skip the commit and print:

```
docs/workflow/ already initialised.
```

### 6. Print next steps

```
docs/workflow/ ready.

Next:
  /($)feature <description>   — intake your first feature
  /($)wf-status               — view the dashboard
```


