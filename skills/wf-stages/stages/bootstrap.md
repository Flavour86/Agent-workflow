# Bootstrap Stage

**Triggered by:** `/($)wf-bootstrap <app-name>`. One-shot per app. Skip if
`.env.deploy.local` already exists and CI is already registered.

## What this stage does

Provisions a brand-new app's deploy pipeline: SSH key onto the server, docker
and nginx configs, and a GitHub Actions workflow for auto-deploy on push to
`main`.

## Preconditions
- User has SSH access credentials to the target server.
- User has paste-ready credentials in a gitignored file, not in chat.

## Steps

### 1. Collect credentials

1. Check if `.env.deploy.local` exists. If yes, read it.
2. If missing or incomplete, instruct the user to create it with:
   `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`, `DEPLOY_APP_PATH`, and
   `DEPLOY_PASSWORD`.
3. Wait for the user to confirm. Then read `.env.deploy.local` and parse it.

### 2. Generate deploy key

Create an Ed25519 deploy key at `~/.ssh/<app-name>_deploy` if it does not
already exist.

### 3. Install the public key on the server

Use `mcp__desktop-commander__start_process` plus `interact_with_process` to
run `ssh-copy-id` and respond to the password prompt interactively.

If `ssh-copy-id` fails, stop with a failing gate. Do not loop.

### 4. Verify key-only auth

Run an SSH command with `PasswordAuthentication=no` and expect `ok`.

### 5. Purge the password from `.env.deploy.local`

Instruct the user to remove the `DEPLOY_PASSWORD=...` line, wait for `done`,
then re-read the file and confirm the line is gone.

### 6. Add SSH config entry

Append a host entry for `<app-name>-deploy` to `~/.ssh/config`.

### 7. Provision server-side resources

Create the app directory and ensure docker plus nginx are installed on the
server.

### 8. Sync initial configs

Prepare local deploy configs and `rsync` them to the target server.

### 9. Create GitHub Actions workflow for auto-deploy

Create `.github/workflows/deploy.yml`, set the required GitHub secrets, commit
the workflow file, and push `main`.

### 10. Verify the CI workflow registered

Invoke the `deployment-status-check` skill and confirm the workflow appears.

### 11. Write `DEPLOY.md`

Create a root-level deploy reference covering SSH access, auto-deploy, and
rollback.

### 12. Final handoff

Print a handoff with the SSH alias, server path, workflow path, and first-run
status.

## Gate checklist

- [ ] Deploy key installed on server.
- [ ] Key-only auth verified.
- [ ] Password line removed from `.env.deploy.local`.
- [ ] SSH config entry added.
- [ ] Server-side docker + nginx ready.
- [ ] Initial configs synced.
- [ ] GitHub Actions workflow committed and registered.
- [ ] GitHub secrets set.
- [ ] `deployment-status-check` reports the workflow is live.
- [ ] `DEPLOY.md` written.

## Failure recovery

If `ssh-copy-id` fails:

1. Stop immediately.
2. Print the error verbatim.
3. Warn the user that the password line is still in `.env.deploy.local` and
   must be removed before rerunning Bootstrap.
