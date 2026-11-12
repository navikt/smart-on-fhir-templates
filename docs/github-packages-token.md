# GitHub Packages token

The `ehr-launch` app depends on [`@navikt/smart-on-fhir`](https://github.com/navikt/smart-on-fhir), which is published only on [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry). GitHub Packages requires a token to install npm packages, including public packages. `backend-services` does not use this package and needs no GitHub Packages token.

## Create the token

1. Open [github.com/settings/tokens/new?scopes=read:packages](https://github.com/settings/tokens/new?scopes=read:packages). That is **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)** > **Generate new token (classic)**. See [managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). Fine-grained tokens do not work with GitHub Packages for npm.
2. Tick only `read:packages`. Set an expiry.
3. Copy the token once. You cannot view it again.

Never commit the token. [`ehr-launch/.npmrc`](../ehr-launch/.npmrc) only refers to the variable `NPM_AUTH_TOKEN`, so the token stays on your machine.

## Windows

Use the settings dialog, which keeps the token out of your command history: Windows search > "Edit environment variables for your account" > **New** > name `NPM_AUTH_TOKEN`, value your token.

Or in PowerShell:

```powershell
[Environment]::SetEnvironmentVariable('NPM_AUTH_TOKEN', 'paste-token-here', 'User')
```

This stores the token in your user environment, but the command is also saved in PowerShell history. Use the dialog to avoid recording it. Close and reopen the terminal. If you use VS Code, restart it so it picks up the new variable.

## macOS and Linux

Add this line to `~/.zshrc` or `~/.bashrc`, with your token in place of the placeholder:

```sh
export NPM_AUTH_TOKEN=paste-token-here
```

Open a new terminal. The token is stored in plain text in that file, so only do this on a machine you control. To keep it out of your shell history, edit the file in an editor instead of using `echo`.

## Codespaces

Add `NPM_AUTH_TOKEN` as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces) for this repository. Create a new codespace afterwards.

## Check

Check that the new terminal sees the variable, without printing the token.

PowerShell:

```powershell
if ($env:NPM_AUTH_TOKEN) { 'set' } else { 'missing' }
```

macOS and Linux:

```sh
[ -n "$NPM_AUTH_TOKEN" ] && echo set || echo missing
```

Run `npm install` from `ehr-launch/`; its `.npmrc` points npm at GitHub Packages. See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) if it reports a 401.
