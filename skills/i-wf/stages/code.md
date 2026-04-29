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

1. Ensure you are in the worktree at `${projectDir}/.worktrees/<feature-id>/` (already on the feature branch). No chunk branch is created — all commits go directly on the feature branch.

2. Read the chunk section (including Design notes) from `${projectDir}/docs/workflow/features/<feature-id>/chunks.md`. Read any rejection notes from `${projectDir}/docs/workflow/features/<feature-id>/log.md`.

3. **Read the visual specifications file:** `${projectDir}/docs/workflow/features/<feature-id>/specs/<NN>-<chunk-slug>-specs.md`
   This document is your visual reference for exact colors, typography, spacing, animations, and device compatibility.

4. Read project patterns from `${projectDir}/CLAUDE.md`, `${projectDir}/Agent.md`, or `${projectDir}/Gemini.md` if present.

5. Read the feature's `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` to know all acceptance criteria for this chunk.

6. **For each acceptance criterion**, follow `superpowers:test-driven-development` or `test-driven-development`:
   a. Write the failing test
   b. Run it — verify it fails
   c. Write the minimal implementation following **file placement rules**, **using tailwindcss as much as possible**.
      - **CRITICAL:** Reference the visual specifications for exact colors, typography, spacing, animations
      - **CRITICAL:** Verify all device breakpoints match the specifications (desktop, tablet, mobile)
      - **CRITICAL:** Implement all interactive states (hover, active, disabled) exactly as specified
   d. Run it — verify it passes
   e. Refactor if needed — **extract common logic if needed from multiple modules**, keep code clean 
   f. Compare visually against the design screenshots — ensure exact fidelity to specifications
   g. Commit: one criterion at a time

7. **Visual specification compliance check** before gate:
   - Compare each visual component against the specifications in `${projectDir}/docs/workflow/features/<feature-id>/specs/<NN>-<chunk-slug>-specs.md`
   - Verify all colors match specifications exactly (hex/RGB values)
   - Verify all typography matches (font, size, weight, line-height)
   - Verify all spacing matches (padding, margin, gap values)
   - Verify all device breakpoints are implemented and responsive as specified
   - Verify all interactive states (hover, active, disabled) are implemented
   - Verify all animations and transitions are implemented with correct duration/easing
   - If any specification is not met, fix it before proceeding

8. **Coverage check** before gate:
   - Confirm every acceptance criterion in `INDEX.md` has a corresponding implementation
   - Confirm every section shown in `${projectDir}/docs/workflow/features/<feature-id>/screenshots/` for this chunk has corresponding code
   - If anything is missing, implement it before proceeding

9. **Unused code cleanup:** scan every file touched in this chunk for dead code. Delete it — do not leave it commented out.

10. Run gate checks. If any fail, fix and re-run. Do not show the handoff until all pass.

11. Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`: chunk stage → `Code`, update timestamp.

12. Append to `${projectDir}/docs/workflow/features/<feature-id>/log.md`: Code complete, gate check summary.

13. Show handoff block when all gate checks pass.

## Gate checklist

- [x] `pnpm test` — all tests pass
- [x] `pnpm type-check` — zero type errors
- [x] `pnpm lint` — zero lint errors for all files and zero lint warnings in the touched files
- [x] **Colors match specifications exactly** — all hex/RGB values verified
- [x] **Typography matches specifications exactly** — font, size, weight, line-height all verified
- [x] **Spacing matches specifications exactly** — padding, margin, gap values all verified
- [x] **All device breakpoints implemented** — desktop (≥1024px), tablet (768-1023px), mobile (<768px)
- [x] **All interactive states implemented** — hover, active, disabled states match specifications
- [x] **All animations/transitions implemented** — duration, easing, transform properties as specified
- [x] Every acceptance criterion in `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` has a corresponding implementation
- [x] Every section in the design screenshots for this chunk has corresponding code
- [x] File placement correct — business code in domain folder, shared code in type-based folder
- [x] No unused/dead code in any file touched by this chunk
- [x] `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` and `${projectDir}/docs/workflow/features/<feature-id>/log.md` updated
- [x] Changes committed on the feature branch
- [x] Leverage tailwindcss for all styling
- [x] Abide with the rule that don't repeat slightly different codes accross multiple modules, extract common part

## Rejection path

Append note to `log.md`. Leave chunk at Code stage. Do not revert commits automatically. Re-run Code stage immediately with rejection note in context.
