---
name: wf-promote
description: Promote a feature - merge preproduction into main, trigger auto-deploy, verify, archive. Run only after reviewing preproduction.
disable-model-invocation: true
argument-hint: <feature-id>
---

The user is invoking `/($)wf-promote` with arguments: $ARGUMENTS

Invoke the `wf-stages` skill, if it is not present, print `wf-stages skill is missing. Please add it to the agent.` and stop.
Read `promote.md` in the `wf-stages` skill
and execute the Promote stage exactly as documented there.

Preconditions to check first:
1. `$ARGUMENTS` is a valid feature ID present in `docs/workflow/features/`.
2. All chunks in that feature show `Done` or `Awaiting-Promote`.
3. `.env.deploy.local` exists.

If any precondition fails, stop and explain which one failed.

Otherwise, proceed through the Promote stage steps.
