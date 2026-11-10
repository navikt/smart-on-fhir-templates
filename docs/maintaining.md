# Maintaining

## What runs

On pull requests and pushes to `main`, [`.github/workflows/test.yaml`](../.github/workflows/test.yaml) runs in each app folder (`client-secret`, `private-key-jwt`, `backend-services`) with the Node version in its `.nvmrc`. It runs `npm ci`, `npm test`, `npm run typecheck`, `npm run fmt:check` and `npm run lint`.

[`.github/dependabot.yml`](../.github/dependabot.yml) opens weekly pull requests:

- npm minor and patch updates are grouped into one pull request per folder.
- Major updates get their own pull request and are reviewed by hand.
- GitHub Actions updates follow the same split.
- A cooldown of 3 days (`default-days: 3`) delays new releases. See the [options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

## Auto-merge

The merge-only [`.github/workflows/dependabot-auto-merge.yaml`](../.github/workflows/dependabot-auto-merge.yaml) uses `pull_request_target` because Dependabot's `pull_request` runs receive a read-only token that cannot merge. See [troubleshooting Dependabot on Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-on-actions) and the [fetch-metadata notes](https://github.com/dependabot/fetch-metadata/tree/25dd0e34f4fe68f24cc83900b1fe3fe149efef98#readme). It never checks out or runs pull request code; `test.yaml` remains read-only.

The workflow only enables [auto-merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) (`gh pr merge --auto --squash --match-head-commit`). GitHub merges after the required checks pass. If the workflow cannot confirm a condition, it leaves the pull request open for review. Auto-merge is enabled only when:

- the workflow actor and the pull request author are both `dependabot[bot]`, and the branch is in this repository
- the ecosystem is npm
- the aggregate `update-type` from [`dependabot/fetch-metadata`](https://github.com/dependabot/fetch-metadata/tree/25dd0e34f4fe68f24cc83900b1fe3fe149efef98#readme), which is the highest semver change in the whole pull request, is exactly minor or patch, so a major inside a grouped update blocks it
- the head commit is unchanged since the run started
- the target branch requires the checks `test (client-secret)`, `test (private-key-jwt)` and `test (backend-services)`, read from the branch rules (and from legacy branch protection when the token can see it)

No required checks means no auto-merge. Only npm updates are auto-merged, so GitHub Actions updates always get a manual review. Branch rules that Dependabot or an admin can bypass do not protect the merge, so do not add Dependabot as a bypass actor.

## Settings you configure

These are repository settings that files cannot set:

1. Enable **Allow auto-merge** and squash merging in the repository settings.
2. Add a branch ruleset for `main` that requires the three `test` checks to pass (see above for the names). See [about rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

## Major updates

Review the changelog and run the app before merging by hand. You can assign the pull request to [Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) to adapt the code; review its changes like any other contribution.

## Node upgrades

Each year, when a new Node release line goes LTS:

1. Check the [release schedule](https://nodejs.org/en/about/previous-releases).
2. Update the app's `.nvmrc` and `engines.node` in `package.json`. The devcontainer image follows `backend-services`.
3. Regenerate the lockfile with that Node version, then run the checks.
4. Check that every dependency allows the new version in its `engines`. Do not force the install or disable `engine-strict`. Wait for the dependency's release instead.

## Status of the Node 26 move

Only `backend-services` is on Node 26. Its scripts run TypeScript with Node's built-in [type stripping](https://nodejs.org/api/typescript.html#type-stripping), which allows only erasable syntax (no enums, namespaces or constructor parameter properties). The `tsx` dev dependency is still in its `package.json` until the lockfile is regenerated, and can then be removed. `client-secret` and `private-key-jwt` stay on Node 22 and still run through `tsx`.
