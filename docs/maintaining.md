# Maintaining

## What runs

[`.github/workflows/test.yaml`](../.github/workflows/test.yaml) runs for each app folder (`client-secret`, `private-key-jwt`, `backend-services`) on pull requests and pushes to `main`. It uses the Node version in the folder's `.nvmrc` and runs `npm ci`, `npm test`, `npm run typecheck`, `npm run fmt:check` and `npm run lint`.

[`.github/dependabot.yml`](../.github/dependabot.yml) opens weekly pull requests:

- npm minor and patch updates are grouped into one pull request per folder.
- Major updates get their own pull request and are reviewed by hand.
- GitHub Actions updates follow the same split.
- A cooldown of 3 days (`default-days: 3`) delays new releases. See the [options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

## Auto-merge

The `dependabot-merge` job in `test.yaml` runs after every test leg passes (`needs: test`) and merges with `gh pr merge --squash`. It fails closed: any condition it cannot confirm leaves the pull request open for review. It merges only when all of these hold:

- the workflow actor and the pull request author are both `dependabot[bot]`, and the branch is in this repository
- the ecosystem is npm, in one of the three folders
- every updated dependency in the pull request (not only the largest bump) is a minor or patch update, with plain `X.Y.Z` versions, the same major and a higher new version
- the pull request changes only `package.json` and `package-lock.json` in those folders

It uses `dependabot/fetch-metadata` for the per-dependency versions and never checks out the pull request code. Actions and devcontainer updates are not auto-merged. Dependabot runs on `pull_request` get a read-only token unless the job requests more, which the job does through `permissions`, see [automating Dependabot with Actions](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions).

## Settings you configure

These are repository settings that files cannot set:

1. Allow merging pull requests with squash in repository settings.
2. Add a branch ruleset for `main` that requires the three `test` checks to pass. The job already waits for them, but a ruleset also protects manual merges. See [about rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).
3. For `@navikt` dependencies, add `PACKAGES_READ_TOKEN` as both an Actions secret and a Dependabot secret, then reference it in `test.yaml` (`NPM_AUTH_TOKEN: ${{ secrets.PACKAGES_READ_TOKEN }}` on the install step) and in a `registries` entry in `dependabot.yml`. Create the token as in [github-packages-token.md](./github-packages-token.md).

If you later enable [auto-merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository), note that the job calls a plain squash merge, not `--auto`.

## Major updates

Review the changelog, run the app, then merge by hand. You can also assign the pull request to [Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) to adapt the code, and review its result like any other change.

## Node upgrades

Each year, when a new Node release line goes LTS:

1. Check the [release schedule](https://nodejs.org/en/about/previous-releases).
2. Update each `.nvmrc`, `engines.node` in `package.json` and the `.devcontainer/devcontainer.json` image.
3. Regenerate the lockfile with that Node version, then run the checks.
4. Check that every dependency, including `@navikt/smart-on-fhir` once used, allows the new version in its `engines`. Do not force the install or disable `engine-strict`. Wait for the dependency's release instead.

The apps use Node's built-in type stripping, so there is no build step or `tsx`. Keep TypeScript to [erasable syntax](https://nodejs.org/api/typescript.html#type-stripping): no enums, namespaces or constructor parameter properties.

## Status of the migration

`backend-services` already runs on Node 26. `client-secret` and `private-key-jwt` stay on Node 22 until they are merged into one `ehr-launch` app on `@navikt/smart-on-fhir`, which requires Node 24 in its current release. The `tsx` dev dependency in `backend-services` is no longer used by its scripts and can be removed with the next `npm install`.
