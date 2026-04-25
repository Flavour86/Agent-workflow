# Command: advance

**Usage:** `/($)i-wf advance [-a]`

Approves the current stage output and advances the chunk to the next stage. Only valid after a handoff block has been shown — the handoff block signals all gate checks passed.

## Steps

1. **Find the current chunk** — the most recent chunk with a pending handoff (all gate checks passed, awaiting approval).

2. **Find the next stage** in this chunk's declared stage list:
   - If there is a next stage → advance to it
   - If this was the last stage → set chunk to `Done` (or `Awaiting-Promote` if this is the last chunk in the feature)
   - Skip any stages not in the chunk's declared list

3. **Update `docs/workflow/features/<feature-id>/INDEX.md`:** set chunk stage to next stage, update timestamp.

4. **Append to `docs/workflow/features/<feature-id>/log.md`:**
   ```
   ## <DATE> — <chunk-id> — <old-stage> → <new-stage>
   ```

5. **Commit:**
   ```bash
   git commit -m "chore(workflow): advance <chunk-id> to <new-stage>"
   ```

6. **Print:**
   `<chunk-id>: <old-stage> → <new-stage>`
   Then suggest: `/($)i-wf run <feature-id>` or `/($)i-wf promote <feature-id>` at Awaiting-Promote.

## With `-a`

Immediately dispatches the next stage by invoking `run` — no further user input needed until a gate check fails or end of feature.
