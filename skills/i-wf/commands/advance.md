# Command: advance

**Usage:** `/($)i-wf advance [-a]`

Approves the current stage output and advances the chunk to the next stage. Only valid after a handoff block has been shown — the handoff block signals all gate checks passed.

## Steps

0. **Set worktree context.** Run `git worktree list` to find the active feature worktree under `${projectDir}/.worktrees/`. If one exists, use it. If multiple exist, ask the user which feature to advance. All file and git operations execute from inside that worktree.

1. **Find the current chunk** — the most recent chunk with a pending handoff (all gate checks passed, awaiting approval).

2. **Find the next stage** in this chunk's declared stage list:
   - If there is a next stage → advance to it
   - If this was the last stage → set chunk to `Done` (or `Awaiting-Promote` if this is the last chunk in the feature)
   - Skip any stages not in the chunk's declared list

3. **Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`:** set chunk stage to next stage, update timestamp.

4. **Append to `${projectDir}/docs/workflow/features/<feature-id>/log.md`:**
   ```
   ## <DATE> — <chunk-id> — <old-stage> → <new-stage>
   ```

5. **Commit:**
   ```bash
   git commit -m "chore(workflow): advance <chunk-id> to <new-stage>"
   ```

6. **Print:**
   `<chunk-id>: <old-stage> → <new-stage>`

7. immediately do the next stage if next stage is existing

## With `-a`

Immediately dispatches the next stage by invoking `run` — no further user input needed until a gate check fails or end of feature.
