# Integrate Stage

**Handoff:** always human-gate. Stops after preproduction is pushed so the
user can review it.

## What this stage does

Merges the chunk branch into `preproduction`, runs a cross-chunk duplication
review, pushes, and cleans up the chunk branch.

## Steps
1. Preflight: the chunk's QA gate passed, you are on the chunk branch `wf/<feature>/<tree>/<NN>`,
 and the working tree is clean, if not, stop and ask.
2. Invoke the `code-review` skill on the chunk branch. If the review produces
   blocking findings, stop, print the findings in the handoff, and wait for
   `/($)wf-reject <note>` before proceeding.
3. Fetch and check out `preproduction`. Create it from `main` if it is absent.
4. Rebase the chunk branch onto `preproduction`.
5. If rebase produces a conflict, stop. Print the list of conflicting files in
   the handoff and never auto-resolve.
6. Merge the rebased chunk branch into `preproduction`.
7. Run the gate checks on `preproduction`: tests, type-check, and lint must
   still pass after merge.
8. **Cross-chunk duplication review:**
   a. Identify files touched by this chunk.
   b. Identify files touched by this feature's other chunks already merged into
      `preproduction`.
   c. For files in the intersection, scan for duplicated logic between this
      chunk's additions and the prior merges.
   d. If duplication is found, stop and present three options:
      - Extract now
      - Defer to a mini-refactor chunk
      - Document-and-ignore
   e. Continue only after the duplication question is resolved.
9. Push `preproduction` to origin.
10. Delete the chunk branch locally and remotely.
11. In the tree file, collapse this chunk's section to a one-line summary plus
    a link to the log entry.
12. Update `features/<feature-id>/INDEX.md`: chunk stage -> `Done`, or
    `Awaiting-Promote` if it was the last chunk in the feature.
13. If all chunks in a tree now show `Done`, update the tree file header to
    `Awaiting-Promote`.
14. Append to the log: Integrate complete, duplication decision, and push
    commit hash.
15. Run `graphify update .` from `graphify` skill, to keep the graph current (AST-only, no API cost), if the folder `graphify-out` exists
16. Print a handoff telling the user to review preproduction before
    `/($)wf-promote <feature-id>`.

## Gate checklist

- [ ] Rebase clean.
- [ ] Code review (`code-review` skill) passed with no blocking findings.
- [ ] Merge into `preproduction` successful.
- [ ] Tests + type-check + lint green on `preproduction`.
- [ ] Cross-chunk duplication reviewed: extracted, deferred, or documented.
- [ ] `preproduction` pushed to origin.
- [ ] Chunk branch deleted.
- [ ] Tree file and INDEX updated.
- [ ] The current graph in the `graphify-out` is updated

## Rejection path

If the user runs `/($)wf-reject <note>` at Integrate is rare because the merge is already done.
If used, the user must specify whether to revert the merge or leave it in
place and flag the follow-up in the log.
