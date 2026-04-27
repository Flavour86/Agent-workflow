## Repository Overview

This repository is a source library for reusable agent skills.
It stores skill definitions, support files, templates, command references, and eval notes.
The skills are installed into other projects; this repository is not a runtime application.

## Repository Structure

- `skills/` contains the reusable skills.
- `skills/<skill-name>/SKILL.md` is the required entry point for each skill.
- `skills/<skill-name>/commands/` contains command-specific instructions when a skill has subcommands.
- `skills/<skill-name>/stages/` contains workflow-stage instructions when a skill is stage based.
- `skills/<skill-name>/templates/` contains reusable markdown or project files used by the skill.
- `skills/<skill-name>/agents/` contains optional agent metadata.
- `skills/<skill-name>/evals/` contains optional evaluation material.
- `scripts/install.js` copies all skills into `~/.agents/skills/`.

## Current Skills

- `i-wf` is an iterative feature workflow.
  It guides work through Design, Code, QA, Integrate, and Promote stages with human gates.
  Use it for feature delivery that needs state tracking, chunking, branch rules, and handoffs.

- `session-handsoff` prints a structured handoff for the current session.
  It records completed work, remaining work, and the exact starting point for the next session.
  Use it when a future agent needs to resume without full conversation context.

## Agent Editing Rules

- Before editing, read `philosophy.md` and this file.
- Keep changes surgical and directly tied to the user request.
- Preserve each skill as a self-contained directory.
- Keep `SKILL.md` YAML frontmatter at the first byte of the file.
- Do not add a UTF-8 BOM to `SKILL.md`.
- Use edit tools for `SKILL.md`; never use PowerShell `Out-File`, `Set-Content`, or shell redirection.
- Do not self-invoke disabled skills; only run them when the user explicitly asks.
- When adding a skill, update `README.MD` and this file with a short summary.
- Keep documentation lines under 120 characters.
