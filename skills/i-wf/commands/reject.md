# Command: reject

**Usage:** `/($)i-wf reject <note>`

Rejects the current stage output and immediately redoes the stage specified by that stage's rejection path.

## Steps

0. **Set worktree context.** Same as `advance` — run `git worktree list`, find the active feature worktree under `${projectDir}/.worktrees/`, and execute all operations from inside it.

1. **Parse `<note>`.** If empty, ask the user for a reason before continuing.

2. **Identify the current chunk and stage.**

3. **Append to `${projectDir}/docs/workflow/features/<feature-id>/log.md`:**
   ```markdown
   ## <DATE> - <chunk-id> - REJECTED at <stage>

   Reason: <note>
   ```

4. **Apply stage-specific rejection cleanup and target stage.** Read the current stage reference file (`stages/<stage>.md`) and follow its Rejection path section.

5. **Update state according to the stage-specific rejection path:**
   - Design rejection: keep the chunk at `Design`
   - Code rejection: keep the chunk at `Code`
   - QA rejection: route the chunk back to `Code`
   - Integrate rejection: ask the user to confirm, then `git revert HEAD` on the feature branch to undo the integrate commit; keep chunk at `Integrate`

6. **Update state files.** Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` and root `${projectDir}/docs/workflow/INDEX.md` when the target stage changes. Do not advance the chunk.

7. **Commit:**
   ```bash
   git add ${projectDir}/docs/workflow/
   git commit -m "chore(workflow): reject <chunk-id>"
   ```

8. **Print:**
   `<chunk-id> remains at <target-stage>. Redoing <target-stage> now with the rejection note.`

9. **Immediately re-run the target stage** with the rejection note loaded into context as additional guidance.
