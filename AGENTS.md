# Refref agent rules

## Software Factory deploy

GitHub owns PR and protected branches. `sf-codex-runner-01` is the only deploy runner for release environments; `dev` does not deploy. Deployment completes only with Factory receipt `success`, exact SHA and health check.

Do not add GitHub Actions deploy workflows, use direct server SSH or start provider UI deploys. Keep secrets, deploy keys, provider metadata and receipts Factory-owned. If Refref is not onboarded, report the missing Factory registration without blocking work or the PR to `dev`.
