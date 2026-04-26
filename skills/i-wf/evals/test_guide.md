# i-wf Eval Loop — Test Guide

This guide is for any model (Claude, GPT, etc.) running the eval loop. **Read every section before starting.** The most common failure mode is treating the loop as a thought experiment instead of doing real work.

---

## 0. Hard rules — read first

1. **DO NOT SIMULATE.** Every eval requires real file operations, real `git` commands, real outputs. If you "describe what would happen" instead of doing it, the eval is invalid.
2. **DO NOT FABRICATE EVIDENCE.** Grading evidence must be a verbatim quote from a real file you wrote, with the file path. Boilerplate like "simulation followed the spec" is automatic FAIL.
3. **DO NOT GENERATE FAKE COMMIT SHAS.** `commits.txt` must come from `git log --oneline` on a real git repo. Real SHAs are 7+ hex characters from actual commits.
4. **IF YOU CANNOT EXECUTE SOMETHING, MARK IT FAILED.** Don't pretend it worked. Write `passed: false` with an evidence line explaining why (e.g., "tool unavailable: chrome-devtools MCP not installed").
5. **EACH EVAL IS INDEPENDENT.** Every eval gets its own clean fixture. State does not carry across evals.

If you cannot satisfy all 5 rules, stop and tell the user. Do not produce stub outputs.

---

## 1. The skill under test

`i-wf` orchestrates feature development through human-gated stages: Design → Code → QA → Integrate → Promote.

- Claude Code: `/i-wf <subcommand>`  (Codex: `$i-wf <subcommand>`)
- Skill path: `E:\claude\Agent-workflow\skills\i-wf\`
  - `SKILL.md` — dispatcher (read first for `with_skill` runs)
  - `commands/<name>.md` — one per subcommand
  - `stages/<name>.md` — design, code, qa, integrate
  - `templates/*.md` — scaffolds copied by the `feature` command

**Eval definitions:** `skills/i-wf/evals/evals.json` (45 evals across 16 groups).

---

## 2. Prerequisites for the agent

You must have these tools available:
- Shell (bash) with `git`, `mkdir`, `cp`, `cat`
- File read/write
- Ability to spawn subprocesses (for git commands)
- For visual evals (38–43): `pnpm`, Playwright, optionally chrome-devtools MCP

If a tool is missing for a specific eval, mark its expectations as failed (per Hard Rule 4). Do not stub.

---

## 3. The loop — every eval, every time

For one eval `<id>` with `<name>`, do all of these in order:

### 3.1 Create the workspace directory
```bash
mkdir -p i-wf-workspace/iteration-N/eval-<id>-<name>/with_skill/outputs
mkdir -p i-wf-workspace/iteration-N/eval-<id>-<name>/without_skill/outputs
```

### 3.2 Write `eval_metadata.json`
Copy the eval entry from `evals.json` into:
```
i-wf-workspace/iteration-N/eval-<id>-<name>/eval_metadata.json
```

### 3.3 Set up the fixture

Each eval declares a fixture code (A–K). Use the exact recipe in Section 4.

**Critical:** the fixture lives in a `testdir/` folder INSIDE the configuration directory:
```
eval-<id>-<name>/with_skill/testdir/      ← real git repo, real files
eval-<id>-<name>/without_skill/testdir/   ← separate copy, also real
```

Run `cd testdir/` before any command. **Do not skip this step.** If `testdir/` does not exist after your run, the eval is invalid.

### 3.4 Run the prompt

For `with_skill`:
1. Read `skills/i-wf/SKILL.md` and the relevant `commands/<name>.md` (and `stages/<name>.md` if a stage is dispatched).
2. Inside `testdir/`, execute every step from the skill files using real commands. Write real files. Run real `git add` / `git commit`.

For `without_skill`:
1. Do **not** read any file in `skills/i-wf/`.
2. Inside `testdir/`, do whatever a model with general knowledge would do for the prompt. Real commands. Real files.

### 3.5 Capture outputs

In `outputs/`, save these REAL files:

| File | How to produce it |
|---|---|
| `response.txt` | The exact text the skill would print to the user. NOT a summary like "Completed". The actual response. |
| `commits.txt` | Output of `(cd testdir && git log --oneline)` — real SHAs from your real commits |
| `files_modified.txt` | Output of `(cd testdir && git diff --name-only HEAD~N HEAD)` from before-the-command commit to after, where N is the number of new commits. If 0 new commits, write `(none)`. |
| `index_root_after.md` | `cat testdir/docs/workflow/INDEX.md` — only if the command was supposed to modify it |
| `index_feature_after.md` | `cat testdir/docs/workflow/features/<feature-id>/INDEX.md` — same condition |
| `log_after.md` | `cat testdir/docs/workflow/features/<feature-id>/log.md` — same condition |

If a file is not relevant for this eval, omit it. Don't fake it.

### 3.6 Self-grade — write `grading.json`

For each expectation in `eval_metadata.json`:

```json
{
  "expectations": [
    {
      "text": "<verbatim from evals.json>",
      "passed": true,
      "evidence": "outputs/index_feature_after.md line 8: '| 01-login-form | ... | Code |'"
    },
    {
      "text": "<next assertion>",
      "passed": false,
      "evidence": "outputs/commits.txt has no commit matching 'advance' — most recent commit is 'chore(workflow): initialise'"
    }
  ],
  "summary": {"passed": 1, "failed": 1, "total": 2, "pass_rate": 0.5}
}
```

**Evidence rules:**
- Must cite a real file path inside `outputs/` or `testdir/`.
- Must include a quoted snippet (or "no match found" with what was searched).
- Must be DIFFERENT for each expectation. If two expectations have the same evidence, you almost certainly didn't actually check.
- Boilerplate like "simulation followed the spec" → automatic eval invalidation.

### 3.7 Aggregate

After running every eval in a phase, write `i-wf-workspace/iteration-N/benchmark.json`:

```json
{
  "metadata": {
    "skill_name": "i-wf",
    "executor_model": "<your model name>",
    "timestamp": "YYYY-MM-DDTHH:MM:SSZ",
    "evals_run": [12, 13, 14, ...],
    "iteration": N
  },
  "runs": [ /* every eval × every config = one entry */ ],
  "run_summary": {
    "with_skill":    {"pass_rate": {"mean": ?, "min": ?, "max": ?}},
    "without_skill": {"pass_rate": {"mean": ?, "min": ?, "max": ?}},
    "delta":         {"pass_rate": "+0.??"}
  },
  "notes": ["any non-discriminating evals", "any tools unavailable", "any skill issues found"]
}
```

### 3.8 Improve the skill (only if `with_skill` < 1.0)

For each failing `with_skill` eval:
1. Read your `outputs/response.txt` and the failed expectations.
2. Identify the responsible file in `skills/i-wf/` (use the routing table in `SKILL.md`).
3. Edit only what's needed — add a missing step, clarify ambiguity, or fix a wrong instruction.
4. Re-run that eval ONLY (not the whole batch) and confirm it now passes.
5. Re-run any other evals that share the same command/stage to make sure your fix didn't break them.

---

## 4. Fixture recipes (concrete commands)

The test-app at `E:\claude\Agent-workflow\test-app\` is the canonical baseline (Next.js + Tailwind + Playwright, with `docs/workflow/` already initialized but no `docs/workflow/design/` yet).

For each eval, **clone the test-app** into the eval's `testdir/`, then mutate it to match the fixture code.

### Base clone (all fixtures except A start from this)
```bash
cd <eval-dir>/<config>/                              # config = with_skill or without_skill
git clone --no-hardlinks --depth=1 \
  E:/claude/Agent-workflow/test-app testdir
cd testdir
git config user.email "test@eval.local"
git config user.name "Eval"
```

### Fixture A — Empty git repo, no docs/workflow/
```bash
cd <eval-dir>/<config>/
mkdir testdir && cd testdir
git init
git config user.email "test@eval.local" && git config user.name "Eval"
echo "# Test" > README.md
git add README.md && git commit -m "initial commit"
```

### Fixture B — docs/workflow/ initialized, no features
```bash
# Base clone (test-app already has docs/workflow/ from prior init)
# Verify: docs/workflow/INDEX.md exists with empty Active features table
# Verify: docs/workflow/features/.gitkeep and docs/workflow/archive/.gitkeep exist
```

### Fixture C — Active feature, chunk at Design
```bash
# Base clone, then:
git checkout -b wf/2026-04-24-login-page

mkdir -p docs/workflow/features/2026-04-24-login-page/screenshots
touch docs/workflow/features/2026-04-24-login-page/screenshots/.gitkeep

cat > docs/workflow/INDEX.md <<'EOF'
# Workflow Dashboard

## Active features

| Feature | Type | Created | Description | Current chunk | Stage |
|---|---|---|---|---|---|
| 2026-04-24-login-page | feature | 2026-04-24 | Login page | 2026-04-24-login-page/01-login-form | Design |

## Archived
See `archive/`.
EOF

cat > docs/workflow/features/2026-04-24-login-page/INDEX.md <<'EOF'
# Feature: 2026-04-24-login-page

Type: feature
Created: 2026-04-24
Branch: wf/2026-04-24-login-page

## Chunks

| Chunk | Description | Stages | Current Stage | Updated |
|---|---|---|---|---|
| 2026-04-24-login-page/01-login-form | Login form mockup | design,code,qa,integrate | Design | 2026-04-24 |
| 2026-04-24-login-page/02-auth-api | Auth API | code,qa,integrate | Pending | 2026-04-24 |
EOF

cat > docs/workflow/features/2026-04-24-login-page/chunks.md <<'EOF'
# Chunks: 2026-04-24-login-page

## 01-login-form

Description: Login form HTML+CSS visual mockup
Stages: design, code, qa, integrate

Acceptance criteria:
- AC1: Login form visible at center of page
- AC2: Email field with validation
- AC3: Password field with show/hide toggle
- AC4: Submit button with hover/active states
- AC5: Error message on invalid credentials

Design notes:
Form uses card component (bg-white, rounded-lg, shadow-md, p-8). Submit uses btn-primary. Error uses text-error-500.
EOF

cat > docs/workflow/features/2026-04-24-login-page/log.md <<'EOF'
# Log: 2026-04-24-login-page

## 2026-04-24 - 2026-04-24-login-page/01-login-form - Design complete
Designed login form. Tokens used: card, form-control, btn-primary, text-error-500.
EOF

git add docs/
git commit -m "chore(workflow): scaffold feature 2026-04-24-login-page"
```

### Fixture D — Last chunk Awaiting-Promote
Like C, but: chunks all show Done; root INDEX.md feature stage = `Awaiting-Promote`; create `preproduction` branch from `main`; create empty `.env.deploy.local`.

### Fixture E — Two active features
Like C, but: scaffold TWO feature folders (e.g., `2026-04-24-login-page` AND `2026-04-25-dark-mode`), each with its own branch and INDEX.md row.

### Fixture F — test-app, Design + no design/system/
Base clone + Fixture C state. Confirm `docs/workflow/design/system/` does NOT exist yet.

### Fixture G — test-app, Design + existing design/pages/home.html
Base clone + Fixture C state + create:
```bash
mkdir -p docs/workflow/design/system docs/workflow/design/pages
echo "<html><body><h1>tokens</h1></body></html>" > docs/workflow/design/system/tokens.html
echo "# Design overview" > docs/workflow/design/system/overview.md
echo "<html><body><h1>Home</h1><nav>...</nav><main>...</main></body></html>" > docs/workflow/design/pages/home.html
echo "body{}" > docs/workflow/design/pages/home.css
git add docs/workflow/design && git commit -m "chore(workflow): seed design system"
```

### Fixtures H, I, J, K
Build on G, mutate the chunk's `Current Stage` in INDEX.md to `Code`, `QA`, or `Integrate` respectively. Add screenshot PNGs (one per design section) for H. For K, use a 2-chunk feature with chunk 01 already merged (commit on the feature branch).

---

## 5. Verification checklist (before declaring an eval done)

Run these checks AFTER your run. If any fails, fix before submitting.

| Check | Command |
|---|---|
| `testdir/` exists | `ls <eval-dir>/<config>/testdir/.git` |
| `testdir/` is a real git repo | `(cd testdir && git status)` returns sensibly |
| Real commits | `(cd testdir && git log --oneline)` matches `outputs/commits.txt` byte-for-byte |
| State file claims match reality | If grading.json claims "INDEX.md shows X", `cat testdir/docs/workflow/.../INDEX.md` actually shows X |
| Evidence quotes are real | For each expectation evidence, search the cited file for the quoted snippet — it must appear |
| No two expectations share evidence text | Different criteria → different file regions |

---

## 6. Common failure patterns (do NOT do these)

| Anti-pattern | What it looks like | Why it's invalid |
|---|---|---|
| Stub response | `response.txt`: "Result: Completed according to i-wf skill" | Tells you nothing; not a real response |
| Fake commits | `commits.txt`: `b2c3d4e initial commit` | SHA is fake (would be from real git) |
| Boilerplate evidence | Every expectation: "Simulation followed spec" | Means you didn't actually check |
| All-pass with no testdir | grading.json all `passed: true`, but `testdir/` is empty | Self-grading without doing the work |
| Skipping `cd testdir` | Commands run in workspace root, polluting wrong directory | Fixture is invalidated |
| Reading the skill for `without_skill` | Both configs converge to identical responses | Defeats the comparison |

---

## 7. Iteration tracking

After each phase, append to `i-wf-workspace/iteration-N/benchmark.json` notes. Real numbers, not guesses.

For improvements you make to `skills/i-wf/`, append a brief diff summary to the notes — what file, what changed, why.

---

## 8. Done criteria

- All 45 evals have been run with REAL outputs (no stubs)
- Every `with_skill` eval has `pass_rate = 1.0`
- Delta `with_skill − without_skill` ≥ 0.5
- Verification checklist passes for every eval
