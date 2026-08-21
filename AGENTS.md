# OpenStage-PWA Agent Workflow

After any code change:

1. Run `npm.cmd run test:duration`.
2. Run `npm.cmd run build`.
3. If both pass, run `git add` for the intended changed files.
4. Commit with a concise descriptive commit message.
5. Push to `origin main`.
6. Confirm the push succeeded and report the commit hash.

Do not push if validation fails.
Do not create branches.
Do not amend previous commits.
Leave the working tree clean.

Render auto-deploys OpenStage-PWA from GitHub `main`, so a successful push to `origin main` counts as deployment.
