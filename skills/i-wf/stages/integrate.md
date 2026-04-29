# Integrate Stage

Merges the chunk into the feature branch, runs the full test suite, reviews code architecture, and (on last chunk) merges the feature branch into preproduction.

## External dependencies (hard stop if missing)

- `code-review` skill

## Steps

1. Preflight: QA gate passed, working tree clean. You are already on the feature branch inside `${projectDir}/.worktrees/<feature-id>/`.

2. **Invoke `code-review` skill** on the feature branch (current chunk's commits). If blocking findings: fix them in-place, commit, re-run `code-review`. Iterate until no blocking findings. Never stop or ask the user.

3. **Architecture review** (see below). Fix all violations in-place before proceeding.

4. **Run full test suite on the feature branch** (see below). Fix failures in-place.

5. Push the feature branch to origin.

6. In `${projectDir}/docs/workflow/features/<feature-id>/chunks.md`: collapse this chunk's section to a one-line summary + link to log entry.

7. Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`: chunk stage → `Done`.

8. Append to `${projectDir}/docs/workflow/features/<feature-id>/log.md`: integrate complete, architecture decision, commit hash.

9. **If this is the last chunk in the feature:**
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
    d. Run full test suite on `preproduction`. Fix in-place.
    e. Push `preproduction` to origin.
    f. Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`: feature status → `Awaiting-Promote`.

10. Check gate checklist (below). If any item fails: fix in-place, commit, re-check. Iterate until all items pass. Never stop or ask the user. Show handoff block only when all gate checks pass (unless `-a` flag).

11. After user approve the handsoff,
if current chunk is last chunk of the feature print :`Next action: /($)i-wf run <feature-id>` 
else print: `/($)i-wf promote <feature-id>` at Awaiting-Promote.

## Architecture review (hard block)

Before merging, evaluate every file created or modified by this chunk:

**Business code violation:** Business-specific code found in a generic folder (`components/`, `utils/`, `hooks/`) that is only used by this one feature → must be moved to the domain folder.

**Common code violation:** Shared code used by multiple features still sitting in a feature folder → must be moved to the appropriate type-based folder.

**Outcome:** All violations are a hard block. Fix in-place within the Integrate stage, commit the fix, then proceed. No defer or document option.

## Full test suite (runs for every integration)

After merging the chunk into the feature branch, run:

```bash
pnpm test          # full unit test suite — not scoped to this chunk
pnpm test:e2e      # full E2E suite — not scoped to this chunk
pnpm type-check
pnpm lint          # zero errors for all and zero warnings for touched files
```

If any test fails: fix the code in-place within the Integrate stage, commit, re-run the full suite. Repeat until all pass. Do not route back to Code stage — that restarts the entire Code → QA → Integrate cycle unnecessarily.

## Gate checklist

- [x] `code-review` skill checking passed — no blocking findings
- [x] All file placement violations fixed before proceeding
- [x] Full unit + E2E + type-check + lint green on feature branch. Must be zero warnings for touched files.
- [x] If last chunk: feature branch rebased and merged into `preproduction` cleanly, and push
- [x] `${projectDir}/docs/workflow/features/<feature-id>/chunks.md`, `INDEX.md`, `log.md` updated

## Rejection path

There is no rejection path for Integrate. All gate failures are fixed in-place within this stage — fix, commit, re-check, iterate until passing. If the user explicitly runs `/($)i-wf reject` after integrate, ask whether to revert the last commits or create a follow-up chunk. Never auto-revert.
