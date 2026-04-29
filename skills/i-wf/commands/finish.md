# Command: finish

**Usage:** `/($)i-wf finish [feature-id]`

Closes the current chunk immediately by enforcing the integrate gate checklist in-place — skipping Code-review and QA. Use when you have already reviewed and manually verified the code and just need to ensure code quality rules are met before closing the chunk.

## Steps

0. **Set worktree context.** Run `git worktree list`, find the active feature worktree under `${projectDir}/.worktrees/`. If one exists, use it. If multiple exist, use `feature-id` to resolve. Execute all operations from inside the worktree.

1. **Resolve feature and chunk.** If `feature-id` given, use it. Otherwise find the active feature from `git worktree list`. Identify the current in-progress chunk from `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`.

2. **Architecture review** — evaluate every file created or modified in this chunk:

   **Business code violation:** Business-specific code found in a generic folder (`components/`, `utils/`, `hooks/`) that is only used by this one feature → must be moved to the domain folder.

   **Common code violation:** Shared code used by multiple features still sitting in a feature folder → must be moved to the appropriate type-based folder.

   Fix all violations in-place, commit the fix. Iterate until clean. Never stop or ask the user.

3. **Full test suite:**
   ```bash
   pnpm test          # full unit test suite
   pnpm test:e2e      # full E2E suite
   pnpm type-check
   pnpm lint          # zero errors for all, zero warnings for touched files
   ```
   Fix any failure in-place, commit, re-run. Iterate until all pass. Never stop or ask the user.

4. **Push the feature branch to origin.**

5. **Update state files:**
   - `${projectDir}/docs/workflow/features/<feature-id>/chunks.md` — collapse this chunk's section to a one-line summary + link to log entry
   - `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` — chunk stage → `Done`
   - `${projectDir}/docs/workflow/features/<feature-id>/log.md` — append: `Finished manually — skipped: Code-review, QA`

6. **If this is the last chunk in the feature:**
   a. Fetch/create `preproduction` from `main` if absent
   b. Rebase feature branch onto `preproduction`:
      ```bash
      git rebase preproduction
      ```
      If conflict: hard stop, never auto-resolve.
   c. Merge feature branch into `preproduction`:
      ```bash
      git merge --no-ff wf/<feature-id>
      ```
   d. Run full test suite on `preproduction`. Fix in-place, iterate until all pass.
   e. Push `preproduction` to origin.
   f. Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`: feature status → `Awaiting-Promote`.

7. **Commit state files.**

8. **Print:**
   - If more chunks remain: `<chunk-id> Done. Next: /($)i-wf run <feature-id>`
   - If last chunk: `Feature ready. Next: /($)i-wf promote <feature-id>`

## Gate checklist

- [x] All file placement violations fixed — no business code in generic folders, no shared code in feature folders
- [x] Full unit + E2E + type-check + lint green on feature branch. Zero warnings for touched files.
- [x] If last chunk: feature branch rebased and merged into `preproduction` cleanly, and pushed
- [x] `${projectDir}/docs/workflow/features/<feature-id>/chunks.md`, `INDEX.md`, `log.md` updated
