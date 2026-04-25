# Design Stage

Produces a visual mockup for the chunk. All outputs are HTML + CSS files — never markdown. Nothing in this stage touches production code.

## External dependencies (hard stop if missing)

- `ui-ux-pro-max` skill — required for brand-new page design
- `chrome-devtools` MCP — required for screenshots

## File-format rule

All design outputs are **HTML + CSS** — browser-renderable, executable. The ONLY `.md` file under `docs/workflow/design/` is `system/overview.md`. Tokens, pages, and components are never written as markdown specs.

```
docs/workflow/design/
├── system/
│   ├── tokens.html      ← ALL design tokens (colors, typography, spacing, layout grid) in one browser-displayable file
│   └── overview.md      ← design language summary (only .md file)
├── pages/
│   ├── <page>.html      ← full-page mockup
│   └── <page>.css
└── components/
    ├── <comp>.html      ← component mockup with all interaction states
    └── <comp>.css
```

## Detect design mode

Read `docs/workflow/design/pages/` to determine which mode applies:

| Mode | Condition | Action |
|---|---|---|
| **Design system bootstrap** | No `docs/workflow/design/system/` exists | Invoke `ui-ux-pro-max` to produce `design/system/tokens.html` (consolidated colors + typography + spacing + layout grid as live HTML/CSS) and `design/system/overview.md` (text summary). No other files in `system/`. |
| **Prototype provided** | User has passed a file or screenshot from a design tool | Copy and rename to `docs/workflow/design/pages/<page-name>.html` — nothing more |
| **Brand-new page** | Design system exists, no `docs/workflow/design/pages/<page>.html` yet | Invoke `ui-ux-pro-max` to create an entire high-fidelity page mockup as `<page>.html` + `<page>.css` |
| **Iterating existing page** | `docs/workflow/design/pages/<page>.html` already exists | Read existing file → update only the changed sections → leave everything else untouched |

## Steps

1. Read the chunk section from `docs/workflow/features/<feature-id>/chunks.md` — description and acceptance criteria.

2. Check `docs/workflow/design/system/` to understand established tokens. Check `graphify-out/GRAPH_REPORT.md` if present.

3. Apply the correct design mode (see table above).

4. **For iterating existing page:** update only the sections covered by this chunk's acceptance criteria. Never rewrite the entire file. Sections not mentioned in the chunk remain exactly as they were.

5. **For brand-new page or design system bootstrap:** `ui-ux-pro-max` produces high-fidelity HTML + CSS using established design system tokens. Every acceptance criterion from the chunk must have a corresponding visual element.

6. Update or create component files in `docs/workflow/design/components/` if any shared component is created or modified.

7. **Screenshot workflow:**
   a. Open the updated `.html` file in browser via chrome-devtools MCP
   b. Take a screenshot of each section relevant to this chunk
   c. Annotate / circle / highlight the changed areas
   d. Save to `docs/workflow/features/<feature-id>/screenshots/<NN-slug>-<section>.png`

8. Append **Design notes** to this chunk's section in `chunks.md`:
   - Component breakdown (specific enough that a developer makes zero design decisions while coding)
   - Design tokens referenced
   - Interaction notes
   - Screenshot paths

9. Append to `log.md`:
   ```
   ## <DATE> — <chunk-id> — Design complete
   <summary of design decisions and what changed>
   ```

10. Update `INDEX.md`: this chunk's stage → `Design`, update timestamp.

11. Create chunk branch `wf/<feature-id>/<NN>` (or `hotfix/<feature-id>/<NN>` for bug type) from the feature branch if it does not exist. Commit all changes on this branch.

12. Show handoff block when all gate checks pass.

## Gate checklist

- [x] Every acceptance criterion from `chunks.md` has a visual representation in the mockup
- [x] Only existing design tokens used — any new token explicitly flagged
- [x] Component breakdown specific enough — developer makes zero design decisions while coding
- [x] For iteration: only changed sections differ; rest of the file untouched
- [x] Annotated screenshot saved to `features/<feature-id>/screenshots/`
- [x] `ui-ux-pro-max` invoked for brand-new page (if applicable)
- [x] `design/system/` created for first-time app design (if applicable)
- [x] Design notes written into `chunks.md`
- [x] `INDEX.md` and `log.md` updated
- [x] Changes committed to chunk branch

## Rejection path

Append note to `log.md`. Clear the Design notes section in `chunks.md`. Revert the changed sections in the design HTML to their pre-design state. Re-run Design stage immediately with the rejection note in context.
