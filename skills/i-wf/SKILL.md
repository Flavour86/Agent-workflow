---
name: i-wf
description: Iterative Workflow (i-wf) — unified skill for feature development through Design → Code → QA → Integrate → Promote with explicit human gates. Invoke with /i-wf <subcommand> [args] in Claude Code or $i-wf <subcommand> [args] in Codex. Only fires when the user explicitly types /i-wf or $i-wf. Never self-invoke.
argument-hint: <subcommand> [args].
disable-model-invocation: true
---

# Iterative Workflow (i-wf)

You orchestrate feature development through incremental, human-gated stages. Every execution is user-initiated — you never invoke yourself or trigger subcommands on the user's behalf.

## Anti-patterns — check these first

**1. Never run without prerequisites.**

| Subcommand | Requires |
|---|---|
| Any except `init` and `bootstrap` | `docs/workflow/` exists → if not: `Workflow not initialised. Run /($)i-wf init first.` |
| `run`, `advance`, `block`, `reject`, `promote` | Active feature in `docs/workflow/INDEX.md` → if not: `No active feature. Run /($)i-wf feature <description> to start one.` |
| `run`, `advance`, `block`, `reject` | Chunk currently in progress → if not: `No chunk in progress. Check /($)i-wf status.` |

**2. Never invoke implicitly.** Only execute when the user explicitly types `/i-wf` or `$i-wf`.

**3. Always use `/($)i-wf` notation in user-facing messages.** Every message you print to the user that references a command must use `/($)i-wf` (not `/i-wf` alone) so Codex users see `$i-wf` as an option. This applies to all hard-stop messages, handoff blocks, and suggestions. The prerequisite messages above are exact — copy them verbatim.

## Routing

Parse the first word of `$ARGUMENTS` as the subcommand. Read the matching reference file and follow it exactly.

| Subcommand | Reference |
|---|---|
| `init` | `commands/init.md` |
| `feature` | `commands/feature.md` |
| `run` | `commands/run.md` |
| `advance` | `commands/advance.md` |
| `block` | `commands/block.md` |
| `reject` | `commands/reject.md` |
| `status` | `commands/status.md` |
| `promote` | `commands/promote.md` |
| `bootstrap` | `commands/bootstrap.md` |

If the subcommand is missing or unrecognised, print:

```
Usage: /($)i-wf <subcommand> [args]

  init                        — initialise docs/workflow/
  feature <desc> [--type]     — intake feature, decompose into chunks
  run [feature-id] [-a]       — run current chunk's active stage
  advance [-a]                — approve stage, advance to next
  block [feature-id]          — mark current chunk blocked
  reject <note>               — redo current stage with feedback
  status [feature-id]         — read-only dashboard
  promote <feature-id>        — merge preproduction → main
  bootstrap                   — one-shot deploy pipeline setup
```

## Core concepts

- **Feature** — a unit of work decomposed into sequential chunks. ID format: `YYYY-MM-DD-<slug>`.
- **Chunk** — a vertical slice (frontend + backend + API + DB as needed). Strictly sequential. ID: `<feature-id>/<NN-slug>`.
- **Stage** — each chunk declares only the stages it needs: `design → code → qa → integrate`. Not all stages are required for every chunk.
- **Stage enum:** `Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`
- `promote` and `bootstrap` are feature-level commands, not per-chunk stages.

## Git branching model

```
main
 └── wf/<feature-id>            ← feature/refactor/optimization, created at /i-wf feature
 └── hotfix/<feature-id>        ← bug type, created at /i-wf feature
      └── <prefix>/<feature-id>/<NN>   ← chunk branch, from feature branch
           ↓ integrate: chunk → feature branch
      <prefix>/<feature-id>     ← all chunks merge here
           ↓ last chunk: feature branch → preproduction
 └── preproduction              ← created from main if absent
           ↓ /i-wf promote
 └── main
```

| Feature type | Feature branch | Chunk branches |
|---|---|---|
| `feature / refactor / optimization` | `wf/<feature-id>` | `wf/<feature-id>/<NN>` |
| `bug` | `hotfix/<feature-id>` | `hotfix/<feature-id>/<NN>` |

## Handoff block

The handoff block is shown **only when ALL gate checks have passed**. Its presence signals everything is ready for the user's approval. If anything fails or requires human input, stop with a plain-text message — never show the handoff block in that case.

```
===== WORKFLOW HANDOFF =====
Feature: <feature-id>
Chunk:   <feature-id>/<NN-slug>
Stage:   <Design | Code | QA | Integrate>

What I did:
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
  /($)i-wf promote <feature-id>   ← only at Awaiting-Promote
============================
```

**Rules:**
- All gate check items must be `[x]` — never show the handoff with a `[ ]` item. Fix internally and retry.
- `Feature` + `Chunk` must be exact IDs from `INDEX.md`.
- `Artifacts` must list every file produced, including screenshots.
- `Next action` lists only commands valid for the current state.

## Universal hard-fail criteria

Every command and stage output must satisfy all three:
1. Handoff block (if shown) is structurally complete with all `[x]` criteria
2. Stage work meets the quality standards defined in the stage reference file
3. State files (`INDEX.md`, `chunks.md`, `log.md`) are updated accurately

## External dependency rule

Before any stage that requires an external skill or tool, verify it is available. If missing, hard stop:

```
Required: <skill-name>
Install <skill-name> first, then re-run /($)i-wf run <feature-id>.
```

## Auto-advance (`-a`) rules

**Without `-a` (default):** Every stage stops after the handoff block and waits for `/($)i-wf advance`. Use this mode first to verify each stage performs correctly.

**With `-a`:** Auto-advances through all stages without stopping for human approval.

Stops only at: failed gate check (after internal retry exhausted), `/($)i-wf block`, end of feature. Never auto-runs `promote`.

## Stage dispatch

When `run` dispatches a stage, read the matching file and follow it exactly:

- Design → `stages/design.md`
- Code → `stages/code.md`
- QA → `stages/qa.md`
- Integrate → `stages/integrate.md`

Never improvise stage logic outside these files.
