# QA Stage

**Handoff:** auto -> Integrate on gate pass. Machine-checked.

## What this stage does

Runs end-to-end tests, visual regression, and console / network error checks
against the chunk's code on its branch.

## Required tools
- `pnpm test:e2e` - Playwright test runner. If it is not present, create a
  minimal Playwright setup for this chunk or block with a clear note.
- invoke chrome-devtools MCP's `mcp__chrome-devtools__*` - for console and network scanning.
- Visual baseline store: `tests/visual-baseline/`.

## Steps

1. Preflight: ensure you are on the chunk branch `wf/<feature>/<tree>/<NN>`, if not, stop and ask.
2. Start the project's dev server if it is not already running. Note the URL.
3. Capture screenshots of the chunk's routes with
   `mcp__chrome-devtools__take_screenshot` in the chrome-devtools MCP. 
   Save them to `tests/visual-baseline/<chunk-id>/`.
6. If a baseline already exists, override it. If this is the first run,
   prompt the user to approve the new baseline and stop with a pause gate.
7. Scan console and network logs using
   `mcp__chrome-devtools__list_console_messages` and
   `mcp__chrome-devtools__list_network_requests` in the chrome-devtools MCP. 
   Require zero errors or failed requests, if not, 
8. Run Playwright E2E tests scoped to the chunk's routes:
   `pnpm test:e2e --grep "<chunk-slug>"`, only check those features base on the e2e testing.
9. Append a QA report to the tree log: test counts, baseline status, error
   counts, and screenshot paths.
10. Run the gate checklist. If it passes, auto-advance to Integrate.

## Gate checklist

- [ ] `pnpm test:e2e --grep "<chunk-slug>"` passes.
- [ ] Visual regression baseline matches, or a new baseline is approved by the
  user.
- [ ] Zero console errors.
- [ ] Zero failed network requests.

## checklist failed
Clear any new baseline created in this run, and route the chunk back to Code stage and rerun the Code stage to fix Captured issues or base on the user's prompt

## Rejection path
If the user runs `/($)wf-reject <note>` during QA: append the note to the log, doing the workflow follow checklist failed above 
