---
name: wf-status
description: Print workflow dashboard. No args -> root INDEX. Arg -> that feature's INDEX.
disable-model-invocation: true
argument-hint: "[feature-id]"
---

The user is invoking `/wf-status` with arguments: $ARGUMENTS

Invoke the `workflow` skill, if it is not present, print `workflow skill is missing. Please add it to the agent.` and stop.

1. If `$ARGUMENTS` is empty: read `docs/workflow/INDEX.md` and print it
   verbatim.
2. If `$ARGUMENTS` is a feature ID: read
   `docs/workflow/features/<feature-id>/INDEX.md` and print it verbatim. If
   the folder does not exist, check `docs/workflow/archive/` and print from
   there if found, noting the feature is archived.
3. If the feature ID is not found, print an error listing active features from
   the root INDEX.
4. Do not modify any files. This is read-only.
