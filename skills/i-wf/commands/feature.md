# Command: feature

**Usage:** `/($)i-wf feature <description> [--type <feature|bug|refactor|optimization>]`

Intake a new feature: collect all requirements, decompose into chunks, scaffold the folder. The feature command is the root of truth — any gap here cascades into every stage downstream.

## Steps

1. **Parse args.** Extract `<description>` and `--type`. If `--type` is missing, ask the user: `feature | bug | refactor | optimization`.

2. **Check `superpowers:brainstorming` or `brainstorming` skill.** Hard stop if not installed:
   `Required: superpowers:brainstorming — install it first.`

3. **Invoke `superpowers:brainstorming` or `brainstorming` ** to deeply explore the feature with the user.

4. **Ambiguity rule.** If anything is unclear — scope, acceptance criteria, edge cases — stop and ask the user. Do not proceed with assumptions. Resolve 100% of ambiguities before scaffolding.

5. **Decompose into sequential chunks** following these rules:
   - Chunks are strictly sequential — chunk N+1 cannot start until chunk N is integrated
   - Each chunk is a vertical slice: frontend + backend + API + DB as needed
   - Each chunk declares only the stages it needs

   | Chunk type | Typical stages |
   |---|---|
   | New UI (feature) | `design → code → qa → integrate` |
   | Backend / API / optimization | `code → qa → integrate` |
   | Bug fix | `code → qa → integrate` |
   | Pure refactor | `code → qa → integrate` |
   | Config / infra | `code → integrate` |

   Each acceptance criterion must be testable (verifiable pass/fail). Never accept vague criteria like "make it look nice" — get specifics.

   **UI page decomposition rules (apply when chunk type is New UI):**

   - **150-line threshold**: If the entire feature fits in ≤150-200 lines, keep it as a single chunk. Only split when a component would exceed 200 lines.
   - **Split by UI section**: When splitting, each chunk covers one logical UI section. Sections may differ in code size — roughly equivalent is sufficient, do not over-engineer the balance.
   - **Component boundary decision**: Decomposing chunks is simultaneously deciding component architecture. Each UI chunk defines exactly one component and declares its target file path. Deciding the chunk split = deciding which files will exist.
   - **Non-flat folder structure**: All submodules live inside the root business module folder. Each submodule gets its own subfolder.
     ```
     root/        ← root business module
       marketing-nav/            ← submodule folder
         index.tsx
       hero-section/
         index.tsx
       feature-grid/
         index.tsx
       page.tsx                  ← composes submodules
     ```
   - **Page composition**: The route/page file composes all submodule components. Build it in the final integration chunk after all submodules are complete.
   - **Scope balance check**: Before presenting the decomposition, verify no chunk is 3× heavier than others — rebalance if so. If the regression/polish chunk is trivially light, absorb it into the last implementation chunk's QA stage instead.

6. **Present the decomposition** and wait for user approval:
   ```
   Proposed decomposition for "<description>" (--type <type>):

   01-<chunk-slug>: <description>
     Stages: design → code → qa → integrate
     Component: <module-folder>/<submodule-folder>/index.tsx   # UI chunks only
     Acceptance criteria:
       - <specific, testable criterion>
       - <specific, testable criterion>

   02-<chunk-slug>: <description>
     Stages: code → qa → integrate
     Acceptance criteria:
       - <criterion>

   Reply `approve` to scaffold exactly this decomposition.
   Adjust: describe changes in chat.
   ```

7. **On explicit in-chat approval**, generate feature ID: `YYYY-MM-DD-<short-slug>`. Do not treat `/($)i-wf advance` as approval here; `advance` is stage-only.

8. **Create feature branch** from `main`:
   - `bug` type → `hotfix/<feature-id>`
   - all other types → `wf/<feature-id>`

9. **Ensure `preproduction` is up to date** with `main` (create from `main` if absent).

10. **Scaffold feature folder** from templates (copy and fill placeholders):
    - `docs/workflow/features/<feature-id>/feature.md`
    - `docs/workflow/features/<feature-id>/INDEX.md`
    - `docs/workflow/features/<feature-id>/chunks.md`
    - `docs/workflow/features/<feature-id>/log.md`
    - `docs/workflow/features/<feature-id>/screenshots/` (empty folder with `.gitkeep`)

11. **Update `docs/workflow/INDEX.md`** — add a row under Active features.

12. **Commit scaffold on the feature branch.** Stage the workflow docs plus any files the user explicitly referenced or attached during intake (prototypes, mockups, screenshots, reference designs, etc.). Identify these by scanning the intake conversation for file paths or attachments the user mentioned.

    ```bash
    git add docs/workflow/
    git add <file1> <file2> ...   # only files explicitly provided by the user during intake
    git commit -m "chore(workflow): scaffold feature <feature-id>"
    ```

    Do NOT use `git add -A` or `git add .` — only add `docs/workflow/` and the specific files the user provided. If no extra files were provided, omit the second `git add` line.

13. **Print:**
    ```
    Feature <feature-id> scaffolded — N chunks.
    Start: /($)i-wf run <feature-id>
    ```

## Acceptance criteria for this command

Before scaffolding, verify:
- `superpowers:brainstorming` or `brainstorming` was invoked
- Feature type is declared
- All ambiguities resolved — no open questions
- Every chunk has specific, testable acceptance criteria
- Every chunk has a declared stage list matching its type
- All aspects of the user's request are covered by at least one chunk
- For every UI chunk: component target path declared, folder structure is non-flat.
- Scope balance verified: no chunk is 3× heavier than others
- User explicitly approved the decomposition before any scaffold files were created
