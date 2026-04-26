# Command: promote

**Usage:** `/($)i-wf promote <feature-id>`

Merges `preproduction` → `main`, triggers CI/CD deploy, verifies live app, tags, and archives. Never auto-runs — always explicit user invocation.

## Preconditions (hard stop if any fail)

- `<feature-id>` exists in `docs/workflow/features/`
- All chunks show `Done` or `Awaiting-Promote`
- `preproduction` branch exists and is pushed
- `.env.deploy.local` exists
- `deployment-status-check` skill available — hard stop if missing
- `user.json` exists at project root — required for MCP authentication. If missing or there is no user's account in the file when any chrome-devtools MCP call is about to be made, **hard stop immediately** and ask the user:
  ```
  authentication info not found at project root. MCP authentication cannot proceed.
  ```

## Steps

1. Preflight: clean working tree.

2. `git checkout main && git pull origin main`

3. `git merge --no-ff preproduction -m "promote: <feature-id>"`
   - If conflict: hard stop, print conflicting files, never auto-resolve.

4. `git push origin main`

5. Invoke `deployment-status-check` skill. Wait for CI/CD to complete.
   - **If deployment fails:** hard stop. Never revert. Instruct the user:
     ```
     Deploy failed. Fix forward:
     /($)i-wf feature <fix description> --type bug
     ```

6. **Smoke check** — all three must pass. If any fails: hard stop, fix-forward only.
   a. Before navigating: verify whether authentication info exists at project root — hard stop if missing (see Preconditions). Navigate to every route touched by this feature via chrome-devtools MCP
   b. Verify each route: HTTP 200, zero console errors, zero failed network requests
   c. Screenshot each route and visually compare against `docs/workflow/design/pages/` mockups

7. Tag: `git tag feature/<feature-id>-done && git push origin --tags`

8. Delete all `wf/<feature-id>/*` and `hotfix/<feature-id>/*` branches locally and remotely.

9. Move `docs/workflow/features/<feature-id>/` → `docs/workflow/archive/<YYYY-QQ>/<feature-id>/`

10. Remove feature row from `docs/workflow/INDEX.md`.

11. `git add -A && git commit -m "archive: <feature-id>" && git push origin main`

12. Print handoff with feature ID, commit SHA, tag, live URL, and archive path.

## Deployment failure rule

After merging to `main`: **never revert under any circumstances.** If deploy fails or smoke check fails, the user creates a fix-forward bug chunk via `/($)i-wf feature`. This keeps `main`'s history clean and predictable.
