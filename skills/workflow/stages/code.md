# Code Stage

**Handoff:** always human-gate. Never auto-advances to QA.

## What this stage does

Implements the chunk on its branch using TDD. Must follow the approved Design
notes.

## Required skills

- `test-driven-development` - enforce red -> green -> refactor.
- `next-best-practices` - consult for React / Next.js patterns.

## Coding rules:
Apply these rules to every file created or modified in this stage.

### Business code
1. Code that belongs to a specific feature or domain goes inside that domain's
folder. 
Example: everything related to the chat feature lives under `chat/` — do not
scatter chat logic into generic folders.
2. A business domain folder is not flat — when a domain is large enough to contain distinct named sub-concerns, it should be split into sub-module folders. Each sub-module folder hosts all code that belongs exclusively to that sub-concern.
Example:
```
chat/
   list/  ← conversation list related code
      friends/  ← private list related code
      groups/  ← group list related code
   chat-main/  ← chat main, includes header, box, footer(input)
      chat-header/
      chat-box/
      chat-footer/
```
If first time we develop the friends list, and we should create the `chat` and `list` folder first.


### Common / shared code
Code that is genuinely reusable across multiple features is not business code.
Place it by *type*, not by feature:
- Shared UI components → common components folder (e.g. `components/`)
- Shared utilities → common utils folder (e.g. `utils/` or `lib/`)
- Shared hooks → common hooks folder (e.g. `hooks/`)
Only move code to a common folder when it is actually used by more than one
feature. Do not pre-emptively genericise business code.

### Unused code cleanup
Before the gate checks, scan every file touched in this chunk for code that is
no longer used anywhere in the project (dead code). Delete unused code — do not leave it commented out or
flagged for "later".

## Steps
1. Preflight: ensure you are on the chunk branch `wf/<feature>/<tree>/<NN>`
   with a clean working tree, if it doesn't exist, create the chunk branch `wf/<feature>/<tree>/<NN>`.
2. Read the chunk section, including approved Design notes, from the tree
   file.
3. Follow `test-driven-development` and `next-best-practices` skill for each acceptance criterion:
   a. Write the failing test first.
   b. Run it to verify it fails.
   c. Write the minimal implementation following the coding rules above.
   d. Run it to verify it passes.
   e. Refactor if needed.
   f. Commit small, one-criterion-at-a-time progress.
4. Follow project basic Patterns or Rules from `CLAUDE.md` or `Agent.md` or `Gemini.md`.
5. Apply unused code cleanup (see above).
6. After all acceptance criteria pass and cleanup is done, run the gate checks below.
7. Stop and print the handoff block regardless of gate outcome — wait for user
   `/($)wf-advance` or `/($)wf-reject`.

## Gate checklist

Run these commands in order. All must pass before printing the handoff.

- [ ] `pnpm test` - all tests pass.
- [ ] `pnpm type-check` - zero type errors.
- [ ] `pnpm lint` - zero lint errors.
- [ ] Unused code removed from all files touched by this chunk.
- [ ] File putting should follow the business code and common code rules

If any check fails, redo it until the code follows the checklist and the business requirements.

## `-a` mode subagent dispatch

Code stage is always a human gate, so `-a` stops here regardless. The subagent
runs the implementation and gate checks, then prints the handoff and waits.
`-a` does not auto-approve Code stage output.

When `/($)wf-run <chunk-id> -a` reaches a new chunk's Code stage:
1. Dispatch a fresh subagent via the Agent tool.
2. Make the subagent prompt self-contained: include the chunk description,
   acceptance criteria, approved design notes, the TDD rule, and the coding rules above.
3. The subagent runs the Code stage through gate checks and cleanup.
4. The subagent prints the handoff block and stops — it does not advance.
5. Do not reuse the subagent for the next chunk - start fresh.
6. If the subagent reports failure or crashes, mark the chunk Blocked, stop
   `-a`, and print the handoff.

## Rejection path
If the user runs `/($)wf-reject <note>` during Code stage review, append the note
to the log, leave the chunk at Code, and do not revert commits automatically.
Redo Code stage immediately according to user's new prompt.
