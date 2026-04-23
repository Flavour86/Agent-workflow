# QA Stage

**Handoff:** auto -> Integrate on gate pass. Machine-checked.

## What this stage does

Runs end-to-end tests, visual regression, and console / network error checks
against the chunk's code on its branch.

## Required tools

- `pnpm test:e2e` - Playwright test runner. If it is not present, create a
  minimal Playwright setup for this chunk or block with a clear note.
- `mcp__chrome-devtools__*` - for console and network scanning.
- Visual baseline store: `tests/visual-baseline/`.

## Steps

1. Preflight: ensure you are on the chunk branch `wf/<feature>/<tree>/<NN>`
   with a clean working tree, if not, stop and ask.
2. Start the project's dev server if it is not already running. Note the URL.
3. Run Playwright E2E tests scoped to the chunk's routes:
   `pnpm test:e2e --grep "<chunk-slug>"`.
4. If a chunk-scoped test does not exist yet, create one based on the chunk's
   acceptance criteria, then run it. Commit the test.
5. Capture screenshots of the chunk's routes with
   `mcp__chrome-devtools__take_screenshot`. Save them to
   `tests/visual-baseline/<chunk-id>/`.
6. If a baseline already exists, diff against it. If this is the first run,
   prompt the user to approve the new baseline and stop with a pause gate.
7. Scan console and network logs using
   `mcp__chrome-devtools__list_console_messages` and
   `mcp__chrome-devtools__list_network_requests`. Require zero errors or failed
   requests.
8. Append a QA report to the tree log: test counts, baseline status, error
   counts, and screenshot paths.
9. Run the gate checklist. If it passes, auto-advance to Integrate.

## Gate checklist

- [ ] `pnpm test:e2e --grep "<chunk-slug>"` passes.
- [ ] Visual regression baseline matches, or a new baseline is approved by the
  user.
- [ ] Zero console errors.
- [ ] Zero failed network requests.

## First QA run baseline prompt

When a chunk has no existing visual baseline:

1. Capture screenshots.
2. Print them in the handoff with a pause gate.
3. Ask the user to approve the baseline with `/($)wf-advance`, or reject it with
   `/($)wf-reject <note>`.
4. On approval, save the baseline and advance.

## Rejection path

If the user runs `/($)wf-reject <note>` during QA: append the note to the log, route the chunk
back to Code, and clear any new baseline created in this run.
