# Command: promote

**Usage:** `/($)i-wf promote <feature-id>`

Merges `preproduction` → `main`, triggers CI/CD deploy, verifies live app, tags, and archives. Never auto-runs — always explicit user invocation.

## Preconditions (hard stop if any fail)

- `<feature-id>` exists in `${projectDir}/docs/workflow/features/`
- All chunks show `Done` or `Awaiting-Promote`
- `preproduction` branch exists and is pushed
- `${projectDir}/user.json` exists at project root — required for MCP authentication. If missing or there is no user's account in the file when any chrome-devtools MCP call is about to be made, **hard stop immediately** and ask the user:
  ```
  authentication info not found at project root. MCP authentication cannot proceed.
  ```

## Steps

1. Preflight: clean working tree.

2. `git checkout main && git pull origin main`

3. `git merge --no-ff preproduction -m "promote: <feature-id>"`
   - If conflict: hard stop, print conflicting files, never auto-resolve.

4. `git push origin main`

5. **If `deployment-status-check` skill is available:** invoke it and wait for CI/CD to complete.
   - **If deployment fails:** hard stop. Never revert. Instruct the user:
     ```
     Deploy failed. Fix forward:
     /($)i-wf feature <fix description> --type bug
     ```
   - **If skill is not available:** skip this step and continue.

6. Tag: `git tag feature/<feature-id>-done && git push origin --tags`

7. Remove the worktree and delete the feature branch:
   - `git worktree remove ${projectDir}/.worktrees/<feature-id> --force`
   - Delete `wf/<feature-id>` (or `hotfix/<feature-id>`) locally and remotely.

8. Move `${projectDir}/docs/workflow/features/<feature-id>/` → `${projectDir}/docs/workflow/archive/<YYYY-QQ>/<feature-id>/`

9. Remove feature row from `${projectDir}/docs/workflow/INDEX.md`.

10. `git add -A && git commit -m "archive: <feature-id>" && git push origin main`

11. Run `graphify update .` if `${projectDir}/graphify-out/` exists.

12. Print handoff with feature ID, commit SHA, tag, live URL, and archive path.

## Deployment failure rule

After merging to `main`: **never revert under any circumstances.** If deploy fails or smoke check fails, the user creates a fix-forward bug chunk via `/($)i-wf feature`. This keeps `main`'s history clean and predictable.
