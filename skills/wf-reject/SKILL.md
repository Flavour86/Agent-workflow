---
name: wf-reject
description: Reject the most recent stage output. The chunk stays at the current stage; next /wf-run redoes it with the rejection note in context.
disable-model-invocation: true
argument-hint: <note>
---

The user is invoking `/($)wf-reject` with arguments: $ARGUMENTS

Invoke the `wf-stages` skill, if it is not present, print `wf-stages skill is missing. Please add it to the agent.` and stop.

1. `$ARGUMENTS` is the rejection note. If it is empty, ask the user for a
   reason.
2. Determine the current chunk.
3. Append a log entry:

   ```
   ## <DATE> - <chunk-id> - REJECTED at <stage>

   Reason: <note>
   ```

4. Apply stage-specific rejection logic the current stage referenced in the `wf-stages` skill.
5. Leave the INDEX stage unchanged.
6. Print:
   `Chunk <chunk-id> still at <stage>. Now redoing <current stage name> in <chunk-id> with feedback.`
