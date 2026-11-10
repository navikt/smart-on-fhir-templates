# Token for GitHub Packages

`@navikt/smart-on-fhir` is published on GitHub Packages, which requires authentication even for public packages. The `ehr-launch` app planned for this repository will need it. The three apps that exist today do not depend on `@navikt` packages, so you can skip this page for them.

## Create the token

1. Create a classic personal access token with only the `read:packages` scope: [github.com/settings/tokens/new](https://github.com/settings/tokens/new). See [creating a classic token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic). Give it a short expiry.
2. If your organisation uses SAML single sign-on, authorize the token for it.
3. Keep it out of the repository, chat and shell history.

## Store it as NPM_AUTH_TOKEN

### Windows

Windows search > "Edit environment variables for your account" > **New**. Name `NPM_AUTH_TOKEN`, value: paste the token. This needs no administrator rights and keeps the token out of PowerShell history. Restart VS Code completely (all windows) and open a new terminal.

### bash

```sh
printf 'Token: '; stty -echo; read -r NPM_AUTH_TOKEN; stty echo; printf '\n'; export NPM_AUTH_TOKEN
```

### zsh

```sh
read -s "NPM_AUTH_TOKEN?Token: "; echo; export NPM_AUTH_TOKEN
```

Both only last for the current shell. To keep it, add `export NPM_AUTH_TOKEN=<your token>` to `~/.bashrc` or `~/.zshrc` with an editor. This stores the token in plain text in your home directory, so only do it on a machine you control. Then open a new terminal.

## Project config

An app folder that depends on a `@navikt` package maps the scope to the registry and reads the token from the environment, never from the file:

```ini
@navikt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_AUTH_TOKEN}
```

Run npm from the app folder. npm reads the project `.npmrc` from the folder you run it in, so running it from the repository root, which has no `package.json`, skips it and gives 401.

If `npm ci` fails with 401 or 403, the variable is missing in that terminal (new variables need a new terminal, and in VS Code a full restart) or the token has expired. Check that it is set without printing it:

```sh
test -n "$NPM_AUTH_TOKEN" && echo set
```

```powershell
if ($env:NPM_AUTH_TOKEN) { "set" }
```

Docs: [working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## CI and Dependabot

Actions and Dependabot read separate secrets. For `@navikt` dependencies, add the same token as both an Actions secret and a Dependabot secret named `PACKAGES_READ_TOKEN`, see [Dependabot and private registries](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-access-to-private-registries) and [using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets). Whether the built-in `GITHUB_TOKEN` can read a public package in another repository is not verified here, so use the personal token. See [maintaining.md](./maintaining.md).
