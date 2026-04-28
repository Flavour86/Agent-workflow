# Integrate Stage

Merges the chunk into the feature branch, runs the full test suite, reviews code architecture, and (on last chunk) merges the feature branch into preproduction.

## External dependencies (hard stop if missing)

- `code-review` skill

## Steps

1. Preflight: QA gate passed, working tree clean, on chunk branch.

2. **Invoke `code-review`** on the chunk branch. If blocking findings: hard stop with a plain-text message listing the findings. Wait for `/($)i-wf reject <note>` before proceeding.

3. **Architecture review** (see below). Fix all violations in-place before merging.

4. Fetch and check out the feature branch (`wf/<feature-id>` or `hotfix/<feature-id>`).

5. Rebase chunk branch onto the feature branch:
   ```bash
   git rebase wf/<feature-id>
   ```
   If conflict: hard stop. Print conflicting files. Never auto-resolve.

6. Merge the rebased chunk branch into the feature branch:
   ```bash
   git merge --no-ff wf/<feature-id>/<NN>
   ```

7. **Run full test suite on the feature branch** (see below). Fix failures in-place.

8. Push the feature branch to origin.

9. Delete the chunk branch locally and remotely.

10. In `chunks.md`: collapse this chunk's section to a one-line summary + link to log entry.

11. Update `INDEX.md`: chunk stage → `Done`.

12. Append to `log.md`: integrate complete, architecture decision, commit hash.

13. **If this is the last chunk in the feature:**
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
    f. Update `INDEX.md`: feature status → `Awaiting-Promote`.

14. Check gate checklist(below), if gate check failed, hard stop and do the Rejection(below) step, otherwise must show handoff block unless the `-a` flag at the end command when all gate checks pass.

15. After user approve the handsoff,
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

- [x] `code-review` passed — no blocking findings
- [x] All file placement violations fixed before merge
- [x] Rebase onto feature branch clean
- [x] Merge into feature branch successful
- [x] Full unit + E2E + type-check + lint green on feature branch. Beside, must be zero warnings for touched files.
- [x] If last chunk: feature branch rebased and merged into `preproduction` cleanly, and push
- [x] Chunk branch deleted locally and remotely
- [x] `chunks.md`, `INDEX.md`, `log.md` updated

## Rejection path

Rare — the merge is already done. If `reject` is used, the user must specify: revert the merge or leave in place and create a follow-up chunk. Never auto-revert.
