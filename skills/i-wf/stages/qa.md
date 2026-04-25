# QA Stage

Verifies the implementation against the design mockup and runs E2E tests. The design mockup is always the visual reference; there is no separate regression baseline.

## External dependencies (hard stop if missing)

- `pnpm test:e2e` (Playwright) - if absent, hard stop with a clear note
- `chrome-devtools` MCP - required for screenshots and console scanning

## Steps

1. Ensure you are on the chunk branch.

2. Start the dev server if not already running. Note the URL.

3. **Visual check per section:**
   a. Navigate to each route relevant to this chunk via chrome-devtools MCP
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

6. If all checks pass, append QA report to `log.md`:
   - E2E result (pass count, total)
   - Visual comparison result per section (match / mismatch)
   - Console error count
   - Failed network requests count
   - Screenshot paths

7. Update `INDEX.md`: chunk stage to `QA`, update timestamp.

8. Show the handoff block only when all gate checks pass.

## Gate checklist

QA passes only when both E2E and visual checks pass. Either alone is not sufficient.

- [x] `pnpm test:e2e` passes for this chunk's routes
- [x] Every section shown in the design screenshots visually matches the live implementation
- [x] Zero console errors
- [x] Zero failed network requests
- [x] QA report appended to `log.md`
- [x] `INDEX.md` updated

## Rejection path

Append note to `log.md`. Route chunk back to Code stage. Re-run Code stage immediately with the QA failure details (which sections mismatched, which tests failed) in context.
