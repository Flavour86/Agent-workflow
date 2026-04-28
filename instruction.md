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

## Folder Organization for Evals and Workspace

### Evals Directory Structure

Evals are stored in `evals/` and organized by skill name:

```
evals/
├── <skill-name>/
│   └── evals/
│       └── evals.json          # Evaluation definitions and test cases
```

Each skill's evals are self-contained. The `evals.json` file defines the test cases that agents will run.

### Workspace Directory Structure

Test execution results are stored in `i-wf-workspace/` and organized by skill name and iteration:

```
i-wf-workspace/
├── <skill-name>/
│   ├── benchmark-all.json      # Aggregated results across all iterations
│   ├── benchmark-all.md        # Summary report of all iterations
│   ├── iteration-1/
│   │   ├── benchmark.json      # Iteration-level benchmark results
│   │   ├── eval-ID-eval-name/  # Individual eval execution result
│   │   │   ├── eval_metadata.json    # Test metadata (name, status, duration)
│   │   │   └── testdir/             # Test execution environment and outputs
│   │   │       ├── .git/            # Git state of the test
│   │   │       ├── src/             # Project source code
│   │   │       └── [other files]    # Test-specific files and logs
│   │   └── eval-N-eval-name/
│   └── iteration-2/
│       └── [same structure as iteration-1]
```

**Key points:**
- `<skill-name>` matches the skill directory name (e.g., `i-wf`, `session-handsoff`).
- Each iteration (`iteration-1`, `iteration-2`, etc.) represents a test run.
- Each eval within an iteration has its own directory named `eval-ID-eval-name`.
- The `eval_metadata.json` contains test results and execution details.
- The `testdir/` contains the full test environment: git history, source code, and any generated outputs.

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
