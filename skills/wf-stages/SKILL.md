---
name: wf-stages
description: Use when the user explicitly invokes `$workflow` to run the feature workflow, or when Claude slash-command wrappers route a workflow operation into the implementation.
disable-model-invocation: true

---

# Workflow Skill

You are orchestrating the iterative feature workflow.

Navigation guide: `docs/workflow/README.md`， if the `docs/workflow/README.md` does not exist, stop and print `docs/workflow/README.md is missing. Please create it with /($)wf-init.`
The `/($)wf-init` means if the agent is Codex, use `$wf-init`, if the agent is Claude-code, use `/wf-init`, the rule is: for Codex, use `$`, for Claude-code, use `/`, that suits for all the workflow commands following.

## Core concepts

- **Feature** - a unit of work, decomposed into one or more trees.
- **Tree** - an independent lane. Chunks within a tree are strictly
  sequential; chunks across trees are independent.
- **Chunk** - a vertical slice task including (frontend + backend + API + DB as needed).
  Chunk ID: `<feature-slug>/<tree>/<NN-slug>`.
- **Stage** - one of `Pending | Design | Code | QA | Integrate |
  Awaiting-Promote | Done | Blocked | Rejected`.
- **Branch** - `wf/<feature-slug>/<tree>/<NN>` - one branch per chunk,
  deleted after Integrate succeeds.

## Stage dispatch

When running a stage, read the matching reference file:

- Design -> `./stages/design.md`
- Code -> `./stages/code.md`
- QA -> `./stages/qa.md`
- Integrate -> `./stages/integrate.md`
- Promote -> `./stages/promote.md`
- Bootstrap -> `./stages/bootstrap.md`

Follow the reference file exactly. Do not improvise gates.

## Handoff block

Always print this block when stopping for human input. Same shape every time.

```
===== WORKFLOW HANDOFF =====
Chunk: <feature>/<tree>/<NN-slug>
Stage: <name>    Gate: go | reject | pause
What I did:
- <bullet>
- <bullet>

Artifacts:
- <path or URL> - <note>

Gate check:
- [x] <criterion>
- [ ] <criterion>

Next action:
  /($)wf-advance
  /($)wf-reject <note>
  /($)wf-blocked <reason>
  /($)wf-promote <id>
============================
```

## Error recovery rules

| Failure | Action |
|---|---|
| Stage gate fails (tests / lint / type-check) | Stop. Log. Wait for `/($)wf-reject <note>`. No auto-retry. |
| SSH drop during Bootstrap / Deploy | Retry once (5s backoff, then 20s). Second fail -> Blocked. |
| Merge conflict in Integrate | Stop. Print conflicting files. Never auto-resolve. |
| Duplication found in Integrate | Not a failure. Offer three options: extract now / defer to mini-refactor chunk / document-and-ignore. User picks. |
| Subagent crashes during `-a` Code | Mark chunk Blocked. Stop `-a`. Do not silently skip. |
| Unexpected git state | Refuse to run. User resolves. |
| `.env.deploy.local` missing at Deploy / Promote | Stop. Direct to `/($)wf-bootstrap` or manual creation. |
| Playwright baseline missing on first QA | Prompt for baseline creation, or reject to fix UI first. |

## Cleanup policy

| Trigger | Git | Folders |
|---|---|---|
| Chunk reaches Integrate + preproduction push succeeds | Delete `wf/<feature>/<tree>/<NN>` branch | Collapse chunk section in tree file to one-line summary + link to log |
| All chunks in a tree reach preproduction | - | Tree file header -> `Awaiting-Promote` |
| Feature promoted (`preproduction` -> `main`) | Delete any lingering `wf/<feature>/*` branches; tag `feature/<id>-done` | Move `features/<feature-id>/` -> `archive/<YYYY-QQ>/<feature-id>/`; remove root INDEX row |
| `/($)wf-reject` | Keep branch, keep artifacts | Append rejection note to log; no cleanup |

## Templates

When creating a new feature, use these templates as the base in this `workflow` skill folder:

- `templates/feature.md`
- `templates/tree.md`
- `templates/log.md`
- `templates/INDEX-feature.md`

Replace `{{PLACEHOLDERS}}` with concrete values.
