# Promote Stage

**Triggered by:** `/($)wf-promote <feature-id>`. Never auto-promote.

## What this stage does

Merges `preproduction` into `main`, pushes, lets CI/CD auto-deploy, verifies,
tags, and archives the feature folder.

## Preconditions

- The feature INDEX shows all chunks at `Done` or `Awaiting-Promote`.
- `preproduction` contains all chunk merges for this feature.
- `.env.deploy.local` exists for the project.

If any precondition fails, stop and explain it.

## Steps

1. Preflight: clean working tree.
2. `git checkout main`.
3. `git pull origin main`.
4. `git merge --no-ff preproduction -m "promote: <feature-id>"`.
5. If there is a conflict, stop and never auto-resolve.
6. `git push origin main`.
7. Invoke the `deployment-status-check` skill.
8. If deploy fails, stop with a failing gate and link the failing workflow.
9. Smoke-check the live app with `mcp__chrome-devtools__navigate_page`.
10. Tag the main commit:
    `git tag feature/<feature-id>-done && git push origin --tags`.
11. Delete any lingering `wf/<feature>/*` branches.
12. Archive the feature folder to
    `docs/workflow/archive/<YYYY-QQ>/<feature-id>/`.
13. Remove the feature's row from `docs/workflow/INDEX.md`.
14. Commit the archive move: `git add -A && git commit -m "archive: <feature-id>"`.
15. Push: `git push origin main`.
16. Print a handoff with the feature ID, commit SHA, tag, live URL, and
    archive path.

## Gate checklist

- [ ] All chunks `Done` before starting.
- [ ] Main merge clean.
- [ ] Main push succeeded.
- [ ] `deployment-status-check` reports green.
- [ ] Smoke check returns HTTP 200 with zero console errors.
- [ ] Tag pushed.
- [ ] Feature folder archived.
- [ ] Root INDEX row removed.

## Rollback

If the smoke check fails after deploy:

1. Stop.
2. Inform the user and present options:
   a. Revert the promote commit on `main` and push again.
   b. Fix forward with a hotfix chunk.
3. Do not auto-revert. The user picks.
