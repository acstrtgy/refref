<!-- agent-git-toolkit:start -->

## Agent contract

`agent-git` is an opt-in workflow for safe multi-agent git work.

Only invoke `agent-git` when the human explicitly requests it in the prompt (for example by naming `agent-git`, asking for its worktree workflow, publishing, a PR, onboarding, or a release command). Do not infer that ordinary coding work requires it.

Once explicitly invoked, act as the DevOps operator for the current repository and follow its output exactly. Read this repository's instructions, config, remotes, worktrees, CI, and deploy runbooks. Do not call Cloud-Infra for application delivery. Do not edit protected branches or bypass a blocked safety result.

A request that explicitly includes publish, PR, release, deploy, staging, or production authorizes the ordinary commit, push, PR, merge, and documented deployment actions required for that named scope. Do not ask repeatedly for the same authorization. Ask when the target is ambiguous, checks fail, repository policy requires approval, or risk expands materially. Never force-push, reset hard, discard work, modify production data, or cause downtime without specific authorization.

Branch naming: `act` infers a branch type from the request and creates or reuses `<type>/<task-slug>`. Types: `feature/` (new functionality, the default for unclear requests), `fix/` (bug fixes), `refactor/` (restructuring), `chore/` (maintenance, tooling, dependencies), `docs/` (documentation), `test/` (test-only work), and `rescue/<slug>-<timestamp>` (work saved off a protected branch). The legacy `agent/` prefix is still recognized on existing branches but is never used for new tasks.

When the explicit request uses `act`, follow its result exactly: continue only when it says safe, switch to the printed worktree before editing, stop when it asks for restart, and do not edit when it blocks for an unsafe state.

### Mandatory worktree switch

After an explicitly requested `agent-git act` reports a worktree, change your active shell/session directory to that worktree before editing files. The original repository checkout remains on the protected base branch and must not be edited. The correct switch is `cd "$WORKTREE_PATH"`, not `git switch`.

1. Run `agent-git act "<exact user request>" --yes`.
2. Parse the returned `WORKTREE_PATH` (or `NEXT_COMMAND`).
3. Immediately run `cd "<WORKTREE_PATH>"`.
4. Verify:
   ```sh
   pwd
   git branch --show-current
   git status --short
   ```
5. Only after `SAFE_TO_EDIT=yes` and the current directory equals `WORKTREE_PATH`, edit files.
6. If still on a protected checkout such as `main`, `master`, `dev`, `staging`, `production`, or `release`, stop.
7. Never use `git switch` in the original checkout as a substitute for changing into the worktree.

After switching, print a confirmation block:

```text
WORKSPACE ACTIVE
repo root: <repo root>
worktree path: <pwd>
branch: <git branch --show-current>
base branch: <base branch>
safe to edit: yes/no
```

### Release promotion flow

`production` is a real branch, separate from `main`. The flow is: current task worktree -> staging -> production -> main + dev -> cleanup.

1. `agent-git to-staging [--yes] [--dry-run] [--push]` promotes the current task branch into staging. It does not clean up the task worktree.
2. `agent-git to-prod [--yes] [--dry-run] [--push]` promotes staging into production. It does not clean up task worktrees.
3. `agent-git consolidate [--yes] [--dry-run] [--push]` promotes production into main and dev, then cleans up only branches/worktrees fully contained in staging, production, main, and dev.

Branch names come from the `release` object in `.agent-git/config.json` (`taskTargetBranch`, `stagingBranch`, `productionBranch`, `mainBranch`, `integrationBranch`), so always read them from there instead of assuming `staging`/`production`/`main`/`dev`.

### PR-first delivery

When a GitHub remote and PR tooling are available:

1. Finish and test the task, then push its branch.
2. Create a Draft PR from the task branch to `release.taskTargetBranch` (normally staging).
3. Include summary, tests, risks, rollback, and deployment notes.
4. Observe required checks and update the same PR with fixes.
5. Run `agent-git to-staging --dry-run` as the local promotion gate.
6. When checks pass and staging deployment is authorized, mark the PR ready and merge it so the staging branch update triggers deployment.
7. Verify staging, then create and validate a Draft PR from staging to production when production release is authorized.
8. Merge, observe, and verify production; then consolidate production into main and the integration branch.
9. Clean up only after all release branches contain the task.

Use the connected GitHub integration first and `gh` when needed. Never infer a repository or PR base. If no remote exists, report that PR creation is unavailable.

### Direct-promotion fallback

When the repository does not use PRs:

1. Run the matching `--dry-run` command first.
2. Follow the printed handoff and repository policy.
3. When the user's request already authorizes the named deployment scope, run the matching `--yes`/`--push` operation without asking again.
4. Observe the documented deploy system and run post-deploy verification after every environment push.
5. Never clean up before `agent-git consolidate` runs, and never delete a branch or worktree that the cleanup handoff lists as skipped.

<!-- agent-git-toolkit:end -->
