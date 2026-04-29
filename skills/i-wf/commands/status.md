# Command: status

**Usage:** `/($)i-wf status [feature-id]`

Read-only dashboard. Never modifies any file.

## No argument — all active features

Read every feature folder under `${projectDir}/docs/workflow/features/`. Print one line per active feature:

```
<feature-id>    chunk <NN-slug>    <Stage>    <type>
```

Example:
```
2026-04-20-chat-feature      chunk 02-send-button    Code      feature
2026-04-22-dashboard-ui      chunk 01-layout          Design    feature
2026-04-23-login-fix         chunk 01-auth-token      QA        bug
```

If no active features:
`No active features. Start one with /($)i-wf feature <description>.`

## With feature-id argument

Read `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` and print it verbatim.

If the feature-id is not found in `features/`, check `${projectDir}/docs/workflow/archive/` and print from there, noting: `[ARCHIVED]`.

If not found anywhere, print an error listing all active feature IDs from the root `INDEX.md`.

## Rules

- Never write or modify any file
- Current chunk and stage must match `INDEX.md` exactly — do not infer or guess
