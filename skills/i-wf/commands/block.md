# Command: block

**Usage:** `/($)i-wf block [feature-id]`

Marks the current chunk as Blocked. Blocked chunks are excluded from `-a` automation.

## Steps

1. **Resolve feature.** If `feature-id` given, use it. Otherwise read `${projectDir}/docs/workflow/INDEX.md` for the active feature.

2. **Identify the current chunk** in progress.

3. **Ask for a blocking reason** if not provided in arguments.

4. **Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`:** set this chunk's stage to `Blocked`.

5. **Update root `${projectDir}/docs/workflow/INDEX.md`:** set the feature row stage/current chunk to `Blocked` for this chunk so dashboard status matches the feature file.

6. **Append to `${projectDir}/docs/workflow/features/<feature-id>/log.md`:**
   ```
   ## <DATE> — <chunk-id> — BLOCKED

   Reason: <reason>
   Previous stage: <stage>
   ```

7. **Commit:**
   ```bash
   git add ${projectDir}/docs/workflow/
   git commit -m "chore(workflow): block <chunk-id>"
   ```

8. **Print:**
   `<chunk-id> marked Blocked. Resolve the issue, then run /($)i-wf run <feature-id> to resume.`
