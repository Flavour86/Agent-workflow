# Design Stage

**Handoff:** always human-gate. `-a` does not auto-approve Design.

## What this stage does

Produces a mockup + design spec for the chunk, aligned with existing design
tokens and patterns.

## Steps

1. Read the chunk section from
   `docs/workflow/features/<feature-id>/trees/<tree>.md` and pull the
   description plus acceptance criteria.
2. Read `graphify-out/GRAPH_REPORT.md` if present to understand existing UI
   modules and patterns.
3. Invoke the `ui-ux-pro-max` skill with the chunk's description and
   acceptance criteria.
4. Receive the design output: mockup description, component breakdown, and
   token references.
5. Append a **Design notes** subsection to the chunk's section in the tree
   file. Include mockup description, component structure, design tokens
   referenced, and interaction notes.
6. Do not write code yet. Do not create or modify any `.tsx`, `.ts`, or
   `.css` files.
7. Append to the tree log: stage transition and summary of design decisions.
8. Update `features/<feature-id>/INDEX.md`: this chunk's stage -> `Design`,
   and update the timestamp.
9. Create the chunk branch `wf/<feature>/<tree>/<NN>` from `preproduction` if
   it does not exist; commit the tree file and log change on that branch.
10. Print the handoff block with a passing gate and wait for user
    `/($)wf-advance` or `/($)wf-reject`.

## Gate checklist

- [ ] Mockup produced by `ui-ux-pro-max`.
- [ ] Only references existing design tokens, unless the gate is a deliberate
  design-system extension and that is flagged in the handoff.
- [ ] All acceptance criteria are addressed by the design.
- [ ] Design notes written into the tree file.
- [ ] Changes committed to the chunk branch.

## Rejection path

If the user runs `/($)wf-reject <note>`: append the note to the log, leave the
chunk at Design, clear the Design notes subsection, and redo Design stage immediately according to user's new prompt.
