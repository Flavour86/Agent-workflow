---
name: wf-blocked
description: Mark the current chunk Blocked. Excluded from -a automation.
disable-model-invocation: true
argument-hint: <reason> --type <feature|bug|refactor|optimization>
---

The user is invoking `/($)wf-blocked` with arguments: $ARGUMENTS

Invoke the `wf-stages` skill, if it is not present, print `wf-stages skill is missing. Please add it to the agent.` and stop.

1. `$ARGUMENTS` is the blocking reason. If it is empty, ask the user.
2. Determine the current chunk.
3. Update the feature `INDEX.md`: set this chunk's Stage to `Blocked`.
4. Append a log entry:

   ```
   ## <DATE> - <chunk-id> - BLOCKED

   Reason: <reason>
   Previous stage: <stage>
   ```

5. Commit:
   `git commit -m "chore(workflow): block <chunk-id>"`
6. Print:
   `Chunk <chunk-id> marked Blocked. Resolve the reason, then run /($)wf-run <chunk-id> to resume.`
