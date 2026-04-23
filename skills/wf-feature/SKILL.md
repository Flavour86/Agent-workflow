---
name: wf-feature
description: Intake a new feature - propose a tree decomposition, then scaffold the feature folder on user approval.
disable-model-invocation: true
argument-hint: <description> --type <feature|bug|refactor|optimization>
---

The user is invoking `/($)feature` with arguments: $ARGUMENTS

Invoke the `workflow` skill, if it is not present, print `workflow skill is missing. Please add it to the agent.` and stop.

Execute the intake flow:
1. Parse `<description>` and `--type <t>` from `$ARGUMENTS`. If `--type` is
   missing, stop, ask the user which of `feature | bug | refactor | optimization`
   applies, and then continue.
2. Check if Project context file `graphify-out/GRAPH_REPORT.md` or `graphify-out/wiki/index.md` is present, if it is, read it.
3. Invoke the `brainstorming` skill to propose a tree decomposition using the
   rules below.

   ### Tree parallelism rule (STRICT)

   A tree may only be its own separate tree if it can be **started on day 0
   and completed entirely** without waiting for any chunk in any other tree to
   finish. If any chunk in "Tree X" cannot begin until any chunk in "Tree Y"
   has merged, those two trees MUST be collapsed into one tree with sequential
   chunks.

   Test: ask "can two developers work on these two trees simultaneously from
   the very first commit?" If the answer is no, merge them into one tree.

   ### Decomposition guidance by type

   - **feature spanning UI:** identify which UI sections share zero files and
     zero runtime setup between them — only those sections become separate
     trees. Route/layout scaffolding that other sections depend on must be the
     first chunks of the tree that owns it, not a separate tree.
   - **backend-heavy feature:** one tree with vertical layering (schema →
     service → API → UI), or multiple trees only if the subsystems are
     entirely independent (different DB tables, different API namespaces, no
     shared middleware to set up).
   - **bug:** one tree.
   - **optimization:** one tree per bottleneck, only if the bottlenecks share
     no common files.

   ### Stages

   Each chunk progresses through stages. The ONLY allowed stages are the four
   defined in `workflow` skill `stages` folder: **design**, **code**, **qa**, **integrate**.
   (`bootstrap` and `promote` are special one-shot triggers, not per-chunk
   stages.) Do NOT invent new stage names. List only the stages that apply to
   each chunk; omit any that are not needed.

4. Present the proposed decomposition in this exact format, then stop and ask
   the user to approve or adjust:

   ```
   Proposed decomposition for "<description>":

   Tree A: <slug> - <goal>
   <Why this is its own parallel workstream — or "single tree because tasks are sequential">
     01-<chunk-slug>: <description>  [stages: code → qa → integrate]
     02-<chunk-slug>: <description>  [stages: design → code → qa → integrate]

   Tree B: <slug> - <goal> 
   <Why this can start on day 0 without Tree A>
     01-<chunk-slug>: <description>  [stages: code → qa → integrate]

   Approve with: /($)wf-advance
   Adjust with: describe changes in chat.
   ```

   Include the parallelism justification line for every tree. If only one tree
   is produced, write "single tree — tasks are sequential" as the justification.
5. On approval, generate a feature ID in the form `YYYY-MM-DD-<short-slug>`.
6. Fetch and check out `preproduction`. Create it from `main` if it is absent. 
   If it is present, make sure it is up to date with `main`, 
   if not, make it up to date with `main`.
7. Scaffold the feature folder by copying from templates:
   - `docs/workflow/features/<feature-id>/feature.md`
   - `docs/workflow/features/<feature-id>/INDEX.md`
   - `docs/workflow/features/<feature-id>/trees/<tree-slug>.md`
   - `docs/workflow/features/<feature-id>/logs/<tree-slug>.log.md`
8. Add a row to `docs/workflow/INDEX.md` under `## Active features`.
9. Commit the scaffold and all related files(may be added by user) on `preproduction`.
10. Print a handoff with the feature ID and the first-runnable chunks, then
    suggest `Start with /($)wf-run <feature-id>/<tree>/01-<slug>`.
