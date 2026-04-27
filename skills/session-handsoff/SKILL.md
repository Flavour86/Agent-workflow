---
name: session-handsoff
description: Reads the current session context and prints a structured handoff block to the terminal — what was done, what's still to do, and exactly where the next session should start. Invoke with /session-handsoff in Claude Code or $session-handsoff in Codex.
disable-model-invocation: true
---

# Session Handoff

Read the full conversation context of the current session and print the handoff block below. Do not write any files. Do not produce any output outside the block.

## Output format

```
===== SESSION HANDOFF =====

Context:
  <several sentences: what this session was about and why>

Done:
  - <completed item, concrete and specific>
  - <completed item, concrete and specific>

Still to do:
  - <pending item, in the order it should be tackled>
  - <pending item, in the order it should be tackled>

Start here:
  <exact file path, function name, command, or step the next session should begin from>

===========================
```

## Rules

- Every section must have enough detail that a fresh Claude session reading only this block knows what happened and where to continue — no assumed context.
- **Done** — only list things actually completed this session, not goals or intentions.
- **Still to do** — list every unfinished item ordered by priority or natural sequence.
- **Start here** — one precise entry point: a file and line number, a specific command, or a named function. Never a vague description.
- Never add commentary, explanation, or extra sections outside the block.
- Never write to any file.
