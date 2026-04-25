# Command: run

**Usage:** `/($)i-wf run [feature-id] [-a]`

Runs the active stage of the current in-progress chunk.

## Steps

1. **Resolve the feature.** If `feature-id` is given, use it. If absent, read `docs/workflow/INDEX.md` to find the feature currently in progress. If multiple features are active, ask the user which one to run.

2. **Resolve the current chunk.** Read `docs/workflow/features/<feature-id>/INDEX.md` to find the chunk with the earliest non-Done, non-Blocked stage. If no chunk is in progress, print: `No chunk in progress for <feature-id>. Check /($)i-wf status.`

3. **Load chunk context:**
   - Read the chunk's section in `docs/workflow/features/<feature-id>/chunks.md` — description, acceptance criteria, design notes, declared stage list
   - Read `docs/workflow/features/<feature-id>/log.md` — any rejection notes for this chunk
   - Determine the current stage from `INDEX.md`

4. **Validate the stage** is in the chunk's declared stage list. If the INDEX shows a stage not in the chunk's list, that is a data error — stop and ask the user.

5. **Dispatch** by reading `stages/<stage>.md` and following it exactly. Pass `-a` context to the stage.

6. **After stage completion:**
   - Without `-a`: print the handoff block and stop
   - With `-a` and all gate checks passed: auto-advance to the next stage or next chunk without stopping

## `-a` behaviour

With `-a`, after each stage's gate checks pass:
- If the chunk has a next stage: dispatch it immediately
- If the chunk is done (last stage was Integrate): move to the next chunk in the feature, dispatch its first stage
- Stop only if: a gate check fails (after internal retry), `/($)i-wf block` is triggered, or all chunks are Done / Awaiting-Promote
- Never auto-run `promote`
