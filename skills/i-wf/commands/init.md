# Command: init

Sets up `${projectDir}/docs/workflow/` in the target project. Safe to re-run — skips files that already exist.

## Steps

1. Create folders:
   ```bash
   mkdir -p ${projectDir}/docs/workflow/features ${projectDir}/docs/workflow/archive
   touch ${projectDir}/docs/workflow/features/.gitkeep ${projectDir}/docs/workflow/archive/.gitkeep
   ```

2. Write `${projectDir}/docs/workflow/README.md` (skip if already non-empty):
   ```markdown
   # Workflow System

   State for the iterative feature workflow (i-wf).

   ## Navigation
   1. Active features — read `INDEX.md`
   2. Feature detail — open `features/<feature-id>/INDEX.md`
   3. Chunk detail — open `features/<feature-id>/chunks.md`
   4. History — open `features/<feature-id>/log.md`
   5. Completed work — `archive/YYYY-QQ/` (read-only)

   ## Conventions
   - Feature ID: `YYYY-MM-DD-<slug>`
   - Chunk ID: `<feature-id>/<NN-slug>`
   - Branch: `wf/<feature-id>/<NN>` (features) or `hotfix/<feature-id>/<NN>` (bugs)
   - Stages per chunk: declared individually — not every chunk needs all stages
   - Stage values: `Pending | Design | Code | QA | Integrate | Awaiting-Promote | Done | Blocked | Rejected`

   ## Rules
   - State changes via /($)i-wf commands only — never hand-edit
   - If INDEX.md and log.md disagree on a chunk's stage, log.md is authoritative
   - Never edit anything under archive/ — frozen history
   ```

3. Write `${projectDir}/docs/workflow/INDEX.md` (skip if already non-empty):
   ```markdown
   # Workflow Dashboard

   ## Active features

   | Feature | Type | Created | Description | Current chunk | Stage |
   |---|---|---|---|---|---|

   ## Archived
   See `archive/`.
   ```

4. Verify all four paths exist:
   ```bash
   ls ${projectDir}/docs/workflow/README.md ${projectDir}/docs/workflow/INDEX.md \
      ${projectDir}/docs/workflow/features/.gitkeep ${projectDir}/docs/workflow/archive/.gitkeep
   ```

5. If any file was created, commit:
   ```bash
   git add ${projectDir}/docs/workflow/
   git commit -m "chore(workflow): initialise docs/workflow"
   ```
   If nothing changed, skip the commit and print: `${projectDir}/docs/workflow/ already initialised.`

6. Print:
   ```
   ${projectDir}/docs/workflow/ ready.

   Next:
     /($)i-wf feature <description>   — intake your first feature
     /($)i-wf status                   — view the dashboard
   ```
