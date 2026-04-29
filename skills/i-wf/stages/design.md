# Design Stage

Produces a visual mockup for the chunk. All outputs are HTML + CSS files — never markdown. Nothing in this stage touches production code.

## External dependencies (hard stop if missing)

- `ui-ux-pro-max` skill — required for brand-new page design
- `chrome-devtools` MCP — required for screenshots

## File-format rule

All design outputs are **HTML + CSS** — browser-renderable, executable. The ONLY `.md` file under `${projectDir}/docs/workflow/design/` is `system/overview.md`. Tokens, pages, and components are never written as markdown specs.

```
${projectDir}/docs/workflow/design/
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

Read `${projectDir}/docs/workflow/design/pages/` to determine which mode applies:

| Mode | Condition | Action |
|---|---|---|
| **Design system bootstrap** | No `${projectDir}/docs/workflow/design/system/` exists | Invoke `ui-ux-pro-max` to produce `design/system/tokens.html` (consolidated colors + typography + spacing + layout grid as live HTML/CSS) and `design/system/overview.md` (text summary). No other files in `system/`. |
| **Prototype provided** | User has passed a file or screenshot from a design tool | Copy and rename to `${projectDir}/docs/workflow/design/pages/<page-name>.html` — nothing more |
| **Brand-new page** | Design system exists, no `${projectDir}/docs/workflow/design/pages/<page>.html` yet | Invoke `ui-ux-pro-max` to create an entire high-fidelity page mockup as `<page>.html` + `<page>.css` |
| **Iterating existing page** | `${projectDir}/docs/workflow/design/pages/<page>.html` already exists | Read existing file → update only the changed sections → leave everything else untouched |

## Steps

1. Read the chunk section from `${projectDir}/docs/workflow/features/<feature-id>/chunks.md` — description and acceptance criteria.

2. Check `${projectDir}/docs/workflow/design/system/` to understand established tokens. Check `${projectDir}/graphify-out/GRAPH_REPORT.md` if present.

3. Apply the correct design mode (see table above).

4. **For iterating existing page:** update only the sections covered by this chunk's acceptance criteria. Never rewrite the entire file. Sections not mentioned in the chunk remain exactly as they were.

5. **For brand-new page or design system bootstrap:** `ui-ux-pro-max` produces high-fidelity HTML + CSS using established design system tokens. Every acceptance criterion from the chunk must have a corresponding visual element.

6. Update or create component files in `${projectDir}/docs/workflow/design/components/` if any shared component is created or modified.

7. **Screenshot workflow:**
   a. Open the updated `.html` file in browser via chrome-devtools MCP
   b. Before taking any screenshot, execute some javascript to simulate user's action scrolling page from top to bottom — this ensures all sections render regardless of IntersectionObserver state
   c. Scroll to each section and verify it is visually present (not a dark void) before capturing
   d. Take a screenshot of each section relevant to this chunk
   e. Annotate / circle / highlight the changed areas
   f. Save to `${projectDir}/docs/workflow/features/<feature-id>/screenshots/<NN-slug>-<section>.png`

8. **Extract visual specifications** for all visual components in this chunk:
   a. For each component, document:
      - **Colors:** Exact hex/RGB values for all states (default, hover, active, disabled)
      - **Typography:** Font family, size (px), weight, line-height, letter-spacing
      - **Spacing:** Padding, margin, gap values (in px)
      - **Styling:** Border width/style/color, border-radius, box-shadow
      - **Animations:** Animation names, duration, easing, transform properties
      - **Device compatibility:** Specific layout and sizing for desktop (≥1024px), tablet (768-1023px), mobile (<768px)
   b. Create `${projectDir}/docs/workflow/features/<feature-id>/specs/<NN>-<chunk-slug>-specs.md` using the visual-specs.md template
   c. Include visual references (screenshots, design tokens used)
   d. Ensure specifications are complete enough that a developer needs ZERO design decisions while coding

9. Append **Design notes** to this chunk's section in `${projectDir}/docs/workflow/features/<feature-id>/chunks.md`:
   - Component breakdown (specific enough that a developer makes zero design decisions while coding)
   - Link to visual specifications file: `${projectDir}/docs/workflow/features/<feature-id>/specs/<NN>-<chunk-slug>-specs.md`
   - Design tokens referenced
   - Interaction notes (including animations and state changes)
   - Device compatibility notes for each breakpoint
   - Screenshot paths

10. Append to `${projectDir}/docs/workflow/features/<feature-id>/log.md`:
   ```
   ## <DATE> — <chunk-id> — Design complete
   <summary of design decisions and what changed>
   ```

11. Update `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md`: this chunk's stage → `Design`, update timestamp.

12. Commit all design changes on the feature branch inside the worktree.

13. Show handoff block when all gate checks pass.

## Gate checklist

- [x] Every acceptance criterion from `chunks.md` has a visual representation in the mockup
- [x] Visual specifications file created: `${projectDir}/docs/workflow/features/<feature-id>/specs/<NN>-<chunk-slug>-specs.md`
- [x] **Colors:** All colors documented with exact hex/RGB values for all states
- [x] **Typography:** All text elements documented (font, size, weight, line-height, letter-spacing)
- [x] **Spacing:** All padding, margin, gap values documented in pixels
- [x] **Styling:** Borders, border-radius, shadows documented
- [x] **Animations:** All animations and transitions fully specified (name, duration, easing, transform)
- [x] **Device compatibility:** Layout and sizing specified for desktop, tablet, and mobile breakpoints
- [x] Only existing design tokens used — any new token explicitly flagged
- [x] Component breakdown specific enough — developer makes zero design decisions while coding
- [x] For iteration: only changed sections differ; rest of the file untouched
- [x] Annotated screenshot saved to `${projectDir}/docs/workflow/features/<feature-id>/screenshots/`
- [x] `ui-ux-pro-max` invoked for brand-new page (if applicable)
- [x] `${projectDir}/docs/workflow/design/system/` created for first-time app design (if applicable)
- [x] Design notes written into `${projectDir}/docs/workflow/features/<feature-id>/chunks.md` with link to visual specifications
- [x] `${projectDir}/docs/workflow/features/<feature-id>/INDEX.md` and `${projectDir}/docs/workflow/features/<feature-id>/log.md` updated
- [x] Changes committed on the feature branch

## Rejection path

Append note to `log.md`. Clear the Design notes section in `chunks.md`. Revert the changed sections in the design HTML to their pre-design state. Re-run Design stage immediately with the rejection note in context.
