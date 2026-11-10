# Install Node

Each app folder's `.nvmrc` specifies its Node version: `backend-services/` uses 26, while `client-secret/` and `private-key-jwt/` use 22.

npm ships with Node. Local Node installs below are per user and do not require administrator rights. If your organisation blocks an option, ask IT rather than bypassing the policy.

## macOS and Linux

Add the `fnm env` line for your shell to its profile (`~/.zshrc` or `~/.bashrc`) so `fnm use` works in new shells:

```sh
eval "$(fnm env --use-on-cd --shell zsh)"
```

For bash, use `--shell bash`. Then, in an app folder:

```sh
fnm install
fnm use
node -v
```

`fnm install` and `fnm use` read the folder's `.nvmrc`. Open a new terminal after editing the profile.

## Windows

Avoid `winget install OpenJS.NodeJS`; it installs Node machine-wide and requires administrator rights.

### 1. winget and fnm for your user

```powershell
winget install Schniz.fnm --scope user
```

Open a new terminal, initialize fnm for the session, then run these commands from an app folder:

```powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
fnm install
fnm use
node -v
```

The first line initializes fnm for this session. To persist it, add the line to your PowerShell profile (`notepad $PROFILE`). If your execution policy blocks the profile, run it each session.

### 2. fnm without winget

Download the zip from the [fnm releases](https://github.com/Schniz/fnm/releases), unpack it to a folder you own, add that folder to your user `PATH` and continue as in step 1.

### 3. Portable Node zip

1. Pick the version the app folder needs and download the Windows x64 zip from [latest-v22.x](https://nodejs.org/dist/latest-v22.x/) (`client-secret/`, `private-key-jwt/`) or [latest-v26.x](https://nodejs.org/dist/latest-v26.x/) (`backend-services/`). The same page lists `SHASUMS256.txt`.
2. Compare the hash with the line for your zip file:

   ```powershell
   Get-FileHash .\node-v<version>-win-x64.zip -Algorithm SHA256
   ```

3. Unpack to a folder you own, for example `C:\Users\<you>\node`. The zip contains a nested folder `node-v<version>-win-x64`. Put that nested folder, the one holding `node.exe` and `npm.cmd`, on your user `PATH` (Windows search > "Edit environment variables for your account").
4. Open a new terminal and run `node -v`.

Keep only one version on `PATH`. To work with both 22 and 26, use fnm (options 1 or 2) instead.

### 4. GitHub Codespaces

See [Codespaces](#codespaces).

### PowerShell blocks npm

The default Windows PowerShell policy can stop `npm.ps1` from running (error "running scripts is disabled on this system"). Call the batch shim instead:

```powershell
npm.cmd ci
npm.cmd test
```

You can also use Command Prompt, where `npm` resolves to `npm.cmd`. Do not weaken the execution policy just to run npm.

## Codespaces

[GitHub Codespaces](https://docs.github.com/en/codespaces) gives you a ready Node 26 container from this repository's `.devcontainer/devcontainer.json`.

- Choose a European machine location when creating the codespace, if available, or set your [default region](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-default-region-for-github-codespaces). Follow your organisation's rules and use synthetic data only.
- The devcontainer forwards port 3100. Run `npm ci` in the app folder you choose.
- The EHR apps need a public callback: set `REDIRECT_URI` to `https://<codespace-name>-3100.app.github.dev/callback` and register that and `https://<codespace-name>-3100.app.github.dev/launch` with the SMART server, not `localhost`. Set the port to public or private as your SMART server needs.
- `client-secret/` and `private-key-jwt/` need Node 22. The image includes nvm: run `nvm install 22` and `nvm use 22` in that folder.
