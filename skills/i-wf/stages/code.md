# Code Stage

Implements the chunk using TDD. Follows the approved Design notes exactly. Nothing touches production code before this stage.

## External dependencies (hard stop if missing)

- `superpowers:test-driven-development` or `test-driven-development` skill
- `using-context7-for-libraries` skill (for framework/library lookups)

## File placement rules

These rules apply to every file created or modified in this stage. Violations are a hard fail — fix before the gate check.

**Business code:** Feature-specific code lives in its domain folder.
```
chat/
  list/
    friends/    ← friends list code lives here
    groups/     ← group list code lives here
  chat-main/
    chat-header/
    chat-box/
    chat-footer/
```
Start with the broadest domain folder, then add sub-folders as a domain grows large enough to have distinct named sub-concerns.

**Common/shared code:** Code used by more than one feature goes in type-based folders:
- Shared UI components → `components/`
- Shared utilities → `utils/` or `lib/`
- Shared hooks → `hooks/`

Only move code to a common folder when it is actually used by more than one feature — never pre-emptively.

## Steps

1. Ensure you are on the chunk branch. Create it from the feature branch if absent:
   ```bash
   git checkout wf/<feature-id>   # or hotfix/<feature-id>
   git checkout -b wf/<feature-id>/<NN>
   ```

2. Read the chunk section (including Design notes) from `chunks.md`. Read any rejection notes from `log.md`.

3. Read project patterns from `CLAUDE.md`, `Agent.md`, or `Gemini.md` if present.

4. Read the feature's `INDEX.md` to know all acceptance criteria for this chunk.

5. **For each acceptance criterion**, follow `superpowers:test-driven-development` or `test-driven-development`:
   a. Write the failing test
   b. Run it — verify it fails
   c. Write the minimal implementation following **file placement rules**, **using the tailwindcss as possible as you can**.
   d. Run it — verify it passes
   e. Refactor if needed，**extract common logic if it needs from multiple modules**, make code clean 
   f. Commit: one criterion at a time

6. **Coverage check** before gate:
   - Confirm every acceptance criterion in `INDEX.md` has a corresponding implementation
   - Confirm every section shown in `features/<feature-id>/screenshots/` for this chunk has corresponding code
   - If anything is missing, implement it before proceeding

7. **Unused code cleanup:** scan every file touched in this chunk for dead code. Delete it — do not leave it commented out.

8. Run gate checks. If any fail, fix and re-run. Do not show the handoff until all pass.

9. Update `INDEX.md`: chunk stage → `Code`, update timestamp.

10. Append to `log.md`: Code complete, gate check summary.

11. Show handoff block when all gate checks pass.

## Gate checklist

- [x] `pnpm test` — all tests pass
- [x] `pnpm type-check` — zero type errors
- [x] `pnpm lint` — zero lint errors
- [x] Every acceptance criterion in `INDEX.md` has a corresponding implementation
- [x] Every section in the design screenshots for this chunk has corresponding code
- [x] File placement correct — business code in domain folder, shared code in type-based folder
- [x] No unused/dead code in any file touched by this chunk
- [x] `INDEX.md` and `log.md` updated
- [x] Changes committed to chunk branch
- [x] leverage the tailwindcss
- [x] Abide with the rule that don't repeat slightly different codes accross multiple modules, extract common part

## Rejection path

Append note to `log.md`. Leave chunk at Code stage. Do not revert commits automatically. Re-run Code stage immediately with rejection note in context.
