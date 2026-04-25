# Command: bootstrap

**Usage:** `/($)i-wf bootstrap`

One-shot deploy pipeline provisioning for a brand-new app. Interactive — never echo passwords in chat.

## Preconditions

- App name: from argument or read from `package.json`
- If `.env.deploy.local`, `.github/workflows/deploy.yml`, and deploy SSH key all already exist: ask user to confirm re-bootstrap before continuing
- `deployment-status-check` skill required — hard stop if missing

## Steps

1. Check/read `.env.deploy.local`. If missing or incomplete, instruct user to create it with: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_APP_PATH`, `DEPLOY_PASSWORD`. Wait for confirmation before reading.

2. Generate Ed25519 deploy key at `~/.ssh/<app-name>_deploy` if absent.

3. Install public key on server via `ssh-copy-id` — interactive password prompt. If fails: hard stop, warn that `DEPLOY_PASSWORD` line is still in `.env.deploy.local` and must be removed before retrying.

4. Verify key-only auth (`PasswordAuthentication=no`).

5. Instruct user to remove the `DEPLOY_PASSWORD=...` line from `.env.deploy.local`. Wait for confirmation. Re-read file and verify the line is gone before continuing.

6. Append SSH host entry to `~/.ssh/config`.

7. Create app directory on server. Ensure Docker and nginx are installed.

8. Sync initial configs to server via `rsync`.

9. Create `.github/workflows/deploy.yml`, set GitHub secrets, commit and push to `main`.

10. Invoke `deployment-status-check` skill — confirm workflow is registered.

11. Write `DEPLOY.md` at project root.

12. Print handoff: SSH alias, server path, workflow path, first-run status.

## Failure recovery

If `ssh-copy-id` fails: hard stop immediately. Print error verbatim. Warn user the `DEPLOY_PASSWORD` line is still in `.env.deploy.local` and must be removed before re-running bootstrap.
