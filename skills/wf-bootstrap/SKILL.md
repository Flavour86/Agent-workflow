---
name: wf-bootstrap
description: One-shot deploy-pipeline provisioning for a brand-new app. Skip for apps already set up.
disable-model-invocation: true
argument-hint: "[<app-name>]"
---

The user is invoking `/($)wf-bootstrap` with arguments: $ARGUMENTS

Invoke the `wf-stages` skill. Read `bootstrap.md` in the `wf-stages` skill, if it is not present, print `wf-stages skill is missing. Please add it to the agent.` and stop.
and execute the Bootstrap stage exactly as documented there.

Before starting:

1. `$ARGUMENTS` must be a valid app name (alphanumeric + hyphens), if the app name is not given, grab the name from package.json.
2. Check whether Bootstrap has already run for this app. If
   `.env.deploy.local`, `.github/workflows/deploy.yml`, and the deploy SSH key
   all exist, ask the user to confirm they want to re-bootstrap.

If the user confirms, or Bootstrap has not run, proceed through the Bootstrap
stage steps.

This is an interactive command. Never echo passwords into the chat.
