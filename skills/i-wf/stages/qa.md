# QA Stage

Verifies the implementation against the design mockup and runs E2E tests. The design mockup is always the visual reference; there is no separate regression baseline.

## External dependencies (hard stop if missing)

- `pnpm test:e2e` (Playwright) - if absent, hard stop with a clear note
- `chrome-devtools` MCP - required for screenshots and console scanning, if the MCP absent, hard stop with a clear note
- `${projectDir}/user.json` exists at project root — required for MCP authentication. If missing or there is no user's account in the file when any chrome-devtools MCP call is about to be made, **hard stop immediately** and ask the user:
  ```
  authentication info not found at project root. MCP authentication cannot proceed.
  ```

## Steps

1. Ensure you are in the worktree at `${projectDir}/.worktrees/<feature-id>/` (on the feature branch).

2. Start the dev server if not already running. if it isn't running correctly, check it why and revise it until it's running.

3. **Visual specification verification:**
   a. Read the visual specifications file: `${projectDir}/docs/workflow/features/<feature-id>/specs/<NN>-<chunk-slug>-specs.md`
   b. For each visual component, verify:
      - **Colors:** Exact hex/RGB values match — use DevTools color picker to confirm
      - **Typography:** Font size, weight, line-height, letter-spacing match specifications
      - **Spacing:** Padding, margin, gap values match specifications (use DevTools computed styles)
      - **Device compatibility:** Test on all specified breakpoints (desktop ≥1024px, tablet 768-1023px, mobile <768px)
      - **Interactive states:** Verify hover, active, disabled states match specifications
      - **Animations:** Verify animation names, duration, easing, and transform properties

4. **Visual check per section:**
   a. Before navigating: verify whether authentication info exists at project root — hard stop if missing (see Preconditions). Navigate to each route relevant to this chunk via chrome-devtools MCP
   b. Take a screenshot of each section covered by this chunk
   c. Compare each screenshot against the corresponding annotated design screenshot in `${projectDir}/docs/workflow/features/<feature-id>/screenshots/<NN-slug>-<section>.png`
   d. Assess whether the live implementation matches the design intent for each section
   e. Verify all visual specifications from step 3 are met in the live implementation
   f. If any section does not match or any specification is not met, this is a gate failure. Do not proceed.

5. **Console and network scan:**
   - `mcp__chrome-devtools__list_console_messages` - require zero errors
   - `mcp__chrome-devtools__list_network_requests` - require zero failed requests

6. **E2E tests:**
   ```bash
   pnpm test:e2e --grep "<chunk-slug>"
   ```
   Run only tests scoped to this chunk's routes.
   If the command is not defined in `package.json`, hard stop. Do not create test infrastructure during QA.

7. **Gate decision — do this before writing anything:**
   - If ANY check in steps 3, 4, 5, or 6 failed → follow the Rejection path below. Stop here. Do not write the QA report, do not update INDEX.md, do not show the handoff block.
   - If ALL checks passed → continue to steps 8, 9, 10.

8. Append QA report to `${projectDir}/docs/workflow/features/<feature-id>/log.md`:
   - Visual specification verification result (all items passed/failed)
   - Visual comparison result per section (match / mismatch)
   - Device compatibility verification result (desktop, tablet, mobile)
   - Interactive states verification result (hover, active, disabled)
   - Animation/transition verification result
   - E2E result (pass count, total)
   - Console error count
   - Failed network requests count
   - Screenshot paths

9. Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`: chunk stage to `QA`, update timestamp.

10. Terminate the dev server and the browser aroused by `chrome-devtools` MCP if they are still running. And **Show the handoff block.** This step is mandatory — you MUST print the full handoff block as defined in `SKILL.md`. Do not replace it with a prose summary. Unless the `-a` flag at the end of command


## Gate checklist

QA passes only when visual specifications, visual checks, and E2E all pass. All three are required.

- [x] **Visual specifications verified:**
  - [x] All colors match specifications exactly (hex/RGB values)
  - [x] All typography matches (font, size, weight, line-height, letter-spacing)
  - [x] All spacing matches (padding, margin, gap values)
  - [x] All device breakpoints implemented and tested (desktop, tablet, mobile)
  - [x] All interactive states implemented (hover, active, disabled)
  - [x] All animations/transitions match specifications (duration, easing, transform)
- [x] Every section shown in the design screenshots visually matches the live implementation
- [x] `pnpm test:e2e` passes for this chunk's routes
- [x] Zero console errors
- [x] Zero failed network requests
- [x] QA report appended to `log.md` (includes visual specs verification)
- [x] `INDEX.md` updated
- [x] Handoff block printed in full

## Rejection path

Append note to `log.md`. fix the problems with the QA failure details (which sections mismatched, which tests failed) in context without routing back to code stage, and re-do the stage from step 3
