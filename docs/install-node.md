# Install Node

Each app folder has an `.nvmrc` with the Node major it runs on: `backend-services/` needs 26, `client-secret/` and `private-key-jwt/` need 22.

npm ships with Node. All installs below are per user and need no administrator rights, unless your organisation's policy blocks them. Ask your IT department rather than working around a policy.

## macOS and Linux

Install [fnm](https://github.com/Schniz/fnm#installation), then in an app folder:

```sh
fnm install
fnm use
node -v
```

`fnm install` and `fnm use` read the folder's `.nvmrc`. To make `fnm use` work in every new shell, add the `fnm env` line from the fnm installation page to your shell profile.

## Windows

Do not use `winget install OpenJS.NodeJS`. That installer is machine-wide and asks for administrator rights.

### 1. winget and fnm for your user

```powershell
winget install Schniz.fnm --scope user
```

Open a new terminal, then in an app folder:

```powershell
fnm install
fnm use
node -v
```

If `fnm use` says the shell is not set up, run this in the current session:

```powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
```

To make it permanent, add the same line to your PowerShell profile (`notepad $PROFILE`). If your execution policy blocks the profile, keep using the per-session command.

### 2. fnm without winget

Download the zip from the [fnm releases](https://github.com/Schniz/fnm/releases), unpack it to a folder you own, add that folder to your user `PATH` and continue as in step 1.

### 3. Portable Node zip

1. Download the Windows x64 zip from [nodejs.org](https://nodejs.org/en/download) and the matching `SHASUMS256.txt` from the same release folder on [nodejs.org/dist](https://nodejs.org/dist/).
2. Compare the hash with the line for your zip file:

   ```powershell
   Get-FileHash .\node-v<version>-win-x64.zip -Algorithm SHA256
   ```

3. Unpack to a folder you own, for example `C:\Users\<you>\node`. The zip contains a nested folder `node-v<version>-win-x64`. Put that nested folder, the one holding `node.exe` and `npm.cmd`, on your user `PATH` (Windows search > "Edit environment variables for your account").
4. Open a new terminal and run `node -v`.

### 4. GitHub Codespaces

See [Codespaces](#codespaces).

### PowerShell blocks npm

The default Windows PowerShell policy can stop `npm.ps1` from running (error "running scripts is disabled on this system"). Call the batch shim instead:

```powershell
npm.cmd ci
npm.cmd test
```

You can also use Command Prompt, where `npm` resolves to `npm.cmd`. Do not weaken your execution policy only for this.

## Codespaces

[GitHub Codespaces](https://docs.github.com/en/codespaces) gives you a ready Node 26 container from this repository's `.devcontainer/devcontainer.json`.

- Choose the machine location when you create the codespace, for example Europe West, if it is offered. Codespaces runs on a US provider and your organisation's rules still apply, so use synthetic data only.
- The devcontainer forwards port 3100, which opens as `localhost` in your browser. Run `npm ci` in the app folder you choose.
- The `client-secret/` and `private-key-jwt/` apps need Node 22. The image includes nvm: run `nvm install 22` and `nvm use 22` in that folder.
