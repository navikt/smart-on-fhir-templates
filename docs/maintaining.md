# Maintaining

## What runs

On pull requests and pushes to `main`, [`.github/workflows/test.yaml`](../.github/workflows/test.yaml) runs in each app folder (`ehr-launch`, `backend-services`) with the Node version in its `.nvmrc`. It runs `npm ci`, `npm test`, `npm run typecheck`, `npm run fmt:check` and `npm run lint`. The workflow grants `packages: read` and passes `GITHUB_TOKEN` as `NPM_AUTH_TOKEN` to `npm ci`, allowing `ehr-launch` to install `@navikt/smart-on-fhir` from GitHub Packages. Access to packages in another repository's namespace is unverified. If CI's `npm ci` fails with a 401, create a classic token with `read:packages`, store it as an Actions secret and use it instead of `GITHUB_TOKEN`.

[`.github/dependabot.yml`](../.github/dependabot.yml) opens weekly pull requests:

- npm minor and patch updates are grouped into one pull request per folder.
- Major updates get their own pull request and are reviewed by hand.
- GitHub Actions updates follow the same split.
- A cooldown of 3 days (`default-days: 3`) delays new releases. See the [options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).
- `ehr-launch` updates read GitHub Packages through the `github-packages` registry entry. Add the token as a **Dependabot** secret named `DEPENDABOT_PACKAGES_TOKEN` (repository settings > Secrets and variables > Dependabot), a classic token with `read:packages`. See [configuring access to private registries for Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot). Dependabot runs cannot read Actions secrets, so the Dependabot secret is separate.

## Auto-merge

The merge-only [`.github/workflows/dependabot-auto-merge.yaml`](../.github/workflows/dependabot-auto-merge.yaml) uses `pull_request_target` because Dependabot's `pull_request` runs receive a read-only token that cannot merge. See [troubleshooting Dependabot on Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-on-actions) and the [fetch-metadata notes](https://github.com/dependabot/fetch-metadata/tree/25dd0e34f4fe68f24cc83900b1fe3fe149efef98#readme). It never checks out or runs pull request code; `test.yaml` remains read-only.

The workflow only enables [auto-merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) (`gh pr merge --auto --squash --match-head-commit`). GitHub merges after the required checks pass. If the workflow cannot confirm a condition, it leaves the pull request open for review. Auto-merge is enabled only when:

- the workflow actor and the pull request author are both `dependabot[bot]`, and the branch is in this repository
- the ecosystem is npm
- the aggregate `update-type` from [`dependabot/fetch-metadata`](https://github.com/dependabot/fetch-metadata/tree/25dd0e34f4fe68f24cc83900b1fe3fe149efef98#readme) is minor or patch. It reflects the highest semver change in the pull request, so a major in a grouped update blocks auto-merge
- the head commit is unchanged since the run started
- the target branch requires the checks `test (ehr-launch)` and `test (backend-services)` in a [repository ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

The workflow reads required checks from rulesets only because `GITHUB_TOKEN` cannot read classic branch protection rules without admin rights. Without a ruleset, Dependabot pull requests stay open for manual review, even if a classic rule requires the checks. Only npm updates are auto-merged; GitHub Actions updates need manual review. Branch rules do not protect auto-merge if Dependabot or an admin can bypass them. Do not add Dependabot as a bypass actor.

## Settings you configure

These are repository settings that files cannot set:

1. Enable **Allow auto-merge** and squash merging in the repository settings.
2. Add a branch ruleset for `main` (repository settings > **Rules** > **Rulesets**, not a classic branch protection rule) that requires the status checks `test (ehr-launch)` and `test (backend-services)`. See [about rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).
3. Add the Dependabot secret `DEPENDABOT_PACKAGES_TOKEN` described above.

## Major updates

Review the changelog and run the app before merging by hand. You can assign the pull request to [Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) to adapt the code; review its changes like any other contribution.

## Node upgrades

Both apps run on Node 24. Their scripts run TypeScript with Node's built-in [type stripping](https://nodejs.org/api/typescript.html#type-stripping), which allows only erasable syntax (no enums, namespaces or constructor parameter properties).

Move to Node 26 LTS once the published `@navikt/smart-on-fhir` allows it in its `engines`. Check with `npm view @navikt/smart-on-fhir engines` from `ehr-launch/`. Do not force the install or disable `engine-strict`. Then change:

1. `.nvmrc` in `ehr-launch/` and `backend-services/`.
2. `engines.node` in both `package.json` files.
3. `@types/node` in both `package.json` files, to the matching major.
4. The image in [`.devcontainer/devcontainer.json`](../.devcontainer/devcontainer.json).
5. The Node versions in [docs/install-node.md](./install-node.md).

Regenerate both lockfiles with that Node version, then run the checks. For later LTS lines, check the [release schedule](https://nodejs.org/en/about/previous-releases) and repeat.
