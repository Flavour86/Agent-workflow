---
name: wf-run
description: Run the current stage of a workflow chunk. Pass -a to auto-advance through stages and same-tree chunks until a human gate or block.
disable-model-invocation: true
argument-hint: <chunk-id> [-a]
---

The user is invoking `/($)wf-run` with arguments: $ARGUMENTS

Invoke the `wf-stages` skill, if it is not present, print `wf-stages skill is missing. Please add it to the agent.` and stop.

1. Parse the chunk ID and optional `-a` flag from `$ARGUMENTS`. Chunk ID
   format: `<feature-id>/<tree>/<NN-slug>`.
2. Run preflight checks per `SKILL.md`. On any failure, stop with a pause
   gate.
3. Load chunk context:
   - Read the chunk section from
     `docs/workflow/features/<feature-id>/trees/<tree>.md`.
   - Read the tree log
     `docs/workflow/features/<feature-id>/logs/<tree>.log.md`.
   - Read the feature `INDEX.md` to determine the current stage.
   - sometimes some stages are unnecessary, directly skip them to next stage
4. Determine the current stage and dispatch by reading the matching stage
   reference.
5. Follow the stage reference exactly. Update state files and log as the
   reference instructs.
6. At the stage's handoff point, print the handoff block from `SKILL.md`.
7. `-a` auto-advance handling:
   - When finished the current chunk, auto-advance to the next chunk in the same tree, dispatch
     a fresh subagent per the Code stage reference.
   - If the stage handoff is "human-gate", stop and wait.
   - Never run Promote automatically.
   - `-a` stops at human-gate, failed gate, Blocked, Rejected, or end of tree.
8. The handoff always includes the exact next-action list:
   `/($)wf-advance`, `/($)wf-reject <note>`, `/($)wf-blocked <reason>`, or
   `/($)wf-promote <id>` only at Awaiting-Promote.
