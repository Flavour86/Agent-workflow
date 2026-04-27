# Agent Workflow

Agent Workflow is a personal skill library for reusable agent workflows. The repository keeps skill
definitions, command references, templates, agent metadata, and eval notes in one place so they can be
installed into other projects when needed.

The skills in this repo are source assets. They are not meant to run from this repository directly; install
them into your local agent skills directory, then invoke them from the project where you want the workflow.

## Available Skills

### [`i-wf`](skills/i-wf/)

`i-wf` is an iterative feature workflow that guides a feature through Design, Code, QA, Integrate, and
Promote stages. It keeps work chunked, records workflow state in project docs, and uses explicit human
approval gates before moving forward.

Use it when a project needs a repeatable feature delivery process with status tracking, branch conventions,
stage-specific checks, and handoff blocks.

### [`session-handsoff`](skills/session-handsoff/)

`session-handsoff` summarizes the current agent session into a structured handoff block. It captures what
was completed, what remains, and the exact place where a future session should resume.

Use it near the end of a long or interrupted session when the next agent needs enough context to continue
without rereading the entire conversation.

## Installation

Install all skills into the local skills directory:

```bash
npm run install:skills
```

The installer copies every directory under `skills/` to:

```text
~/.agents/skills/
```

You can also install one skill manually by copying its folder from `skills/<skill-name>/` into the skills
directory used by your agent environment.

## Usage

Invoke a skill explicitly from the target project after installation:

```text
/i-wf <subcommand> [args]
$i-wf <subcommand> [args]

/session-handsoff
$session-handsoff
```

`i-wf` supports workflow commands such as `init`, `feature`, `run`, `advance`, `block`, `reject`, `status`,
`promote`, and `bootstrap`. See [`skills/i-wf/SKILL.md`](skills/i-wf/SKILL.md) and the files under
[`skills/i-wf/commands/`](skills/i-wf/commands/) for the command behavior.

## Skills Folder Structure

```text
skills/
  <skill-name>/
    SKILL.md          # Skill frontmatter and main instructions
    commands/         # Optional command-specific instructions
    stages/           # Optional workflow stage instructions
    templates/        # Optional files copied or rendered by the skill
    agents/           # Optional agent configuration metadata
    evals/            # Optional evaluation notes and fixtures
```

Each skill should be self-contained. Add supporting files inside the skill directory and reference them from
`SKILL.md` with relative paths.
