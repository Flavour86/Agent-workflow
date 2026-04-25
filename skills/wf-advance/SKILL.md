---
name: wf-advance
description: Approve the most recent stage output and advance the current chunk to the next stage.
disable-model-invocation: true
---

The user is invoking `/($)wf-advance`.

Invoke the `wf-stages` skill, if it is not present, print `wf-stages skill is missing. Please add it to the agent.` and stop.

1. Determine which chunk is current - the most recent chunk whose log shows a
   pending handoff.
2. If no such chunk exists, print:
   `No chunk awaiting advance. Run /($)wf-status to see active features.`
3. Advance the chunk's current stage in the feature `INDEX.md` and tree file to next in `docs/workflow/features/<feature-id>/INDEX.md`, and find the corresponding stage processing rule in `wf-stages` skill's stage folder.
   ** Be careful, sometimes some stages may be unnecessary, advance the stage according to `Stages` in each chunk **
4. Append a log entry:
   `## <DATE> - <chunk-id> - <old-stage> -> <new-stage>`
5. Commit the state changes:
   `git commit -m "chore(workflow): advance <chunk-id> to <new-stage>"`
6. Print a short confirmation and prompt:
   `<chunk-id> now is advancing from <old-stage>  to <new-stage>`