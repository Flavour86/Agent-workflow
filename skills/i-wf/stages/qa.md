# QA Stage

Verifies the implementation against the design mockup and runs E2E tests. The design mockup is always the visual reference; there is no separate regression baseline.

## External dependencies (hard stop if missing)

- `pnpm test:e2e` (Playwright) - if absent, hard stop with a clear note
- `chrome-devtools` MCP - required for screenshots and console scanning, if the MCP absent, hard stop with a clear note
- `user.json` exists at project root — required for MCP authentication. If missing or there is no user's account in the file when any chrome-devtools MCP call is about to be made, **hard stop immediately** and ask the user:
  ```
  authentication info not found at project root. MCP authentication cannot proceed.
  ```

## Steps

1. Ensure you are on the chunk branch.

2. Start the dev server if not already running. if it isn't running correctly, check it why and revise it until it's running.

3. **Visual check per section:**
   a. Before navigating: verify whether authentication info exists at project root — hard stop if missing (see Preconditions). Navigate to each route relevant to this chunk via chrome-devtools MCP
   b. Take a screenshot of each section covered by this chunk
   c. Compare each screenshot against the corresponding annotated design screenshot in `docs/workflow/features/<feature-id>/screenshots/<NN-slug>-<section>.png`
   d. Assess whether the live implementation matches the design intent for each section
   e. If any section does not match, this is a gate failure. Do not proceed.

4. **Console and network scan:**
   - `mcp__chrome-devtools__list_console_messages` - require zero errors
   - `mcp__chrome-devtools__list_network_requests` - require zero failed requests

5. **E2E tests:**
   ```bash
   pnpm test:e2e --grep "<chunk-slug>"
   ```
   Run only tests scoped to this chunk's routes.
   If the command is not defined in `package.json`, hard stop. Do not create test infrastructure during QA.

6. **Gate decision — do this before writing anything:**
   - If ANY check in steps 3, 4, or 5 failed → follow the Rejection path below. Stop here. Do not write the QA report, do not update INDEX.md, do not show the handoff block.
   - If ALL checks passed → continue to steps 7, 8, 9.

7. Append QA report to `log.md`:
   - E2E result (pass count, total)
   - Visual comparison result per section (match / mismatch)
   - Console error count
   - Failed network requests count
   - Screenshot paths

8. Update `INDEX.md`: chunk stage to `QA`, update timestamp.

9. **Show the handoff block.** This step is mandatory — you MUST print the full handoff block as defined in `SKILL.md`. Do not replace it with a prose summary. Unless the `-a` flag at the end of command

## Gate checklist

QA passes only when both E2E and visual checks pass. Either alone is not sufficient.

- [x] `pnpm test:e2e` passes for this chunk's routes
- [x] Every section shown in the design screenshots visually matches the live implementation
- [x] Zero console errors
- [x] Zero failed network requests
- [x] QA report appended to `log.md`
- [x] `INDEX.md` updated
- [x] Handoff block printed in full

## Rejection path

Append note to `log.md`. Route chunk back to Code stage. Re-run Code stage immediately with the QA failure details (which sections mismatched, which tests failed) in context.
