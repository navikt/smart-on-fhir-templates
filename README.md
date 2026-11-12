# SMART on FHIR templates

Templates for learning and prototyping [SMART on FHIR](https://hl7.org/fhir/smart-app-launch/) apps in Node and TypeScript. See [What this is not](#what-this-is-not).

| Folder | Flow | Client authentication | Node |
|---|---|---|---|
| [ehr-launch/](./ehr-launch/) | EHR launch with patient and encounter context | `none`, `client_secret_basic` or `private_key_jwt`, set in `.env` | 26 |
| [backend-services/](./backend-services/) | `client_credentials`, no user | `private_key_jwt` | 26 |

`ehr-launch/` uses [`@navikt/smart-on-fhir`](https://github.com/navikt/smart-on-fhir), a library under active development. `backend-services/` implements the token request itself because the library does not support `client_credentials`.

## Get started

Start with `ehr-launch/` and the `client_secret_basic` method. Its setup is shorter than the key-based one.

1. [Install Node](#install-node).
2. Create a [GitHub token](#github-token) so npm can install the library.
3. Get the code. Download the ZIP from the repository page with **Code** > **Download ZIP**, then extract it. Or choose **Use this template** > **Create a new repository**, then clone it.
4. Open a terminal in the app folder. On Windows, open PowerShell from Windows search and `cd` into the extracted folder, for example `cd $HOME\Downloads\smart-on-fhir-templates-main\ehr-launch`.
5. Run `npm install`, then create `.env` with the text from the [ehr-launch README](./ehr-launch/README.md#configure). On Windows, run `notepad .env` and confirm creation. On macOS and Linux, run `nano .env`. Save as UTF-8. In Notepad, choose **All Files** so the file is named `.env`, not `.env.txt`. Avoid `echo >` in Windows PowerShell 5.1; it writes UTF-16, which Node cannot read.
6. Run `npm start`, then register the app in the [SMART Health IT launcher](https://launch.smarthealthit.org/) as described in the README. The launcher uses synthetic US data. Do not enter real patient data.

`.env` and `keys/` are in `.gitignore`, so secrets stay out of your repo. For `backend-services/`, follow its [README](./backend-services/README.md). It needs no GitHub token, but it does need a key pair and a registered client.

## Install Node

Both apps use Node 26 LTS, set in each folder's `.nvmrc`. npm ships with Node. These options install Node for your user and do not require administrator rights. If your organisation blocks an option, ask IT rather than bypassing the policy.

**macOS and Linux:** install [fnm](https://github.com/Schniz/fnm#installation), add `eval "$(fnm env --use-on-cd --shell zsh)"` (or `--shell bash`) to `~/.zshrc` or `~/.bashrc`, open a new terminal and run `fnm install` in the app folder. fnm reads `.nvmrc`.

**Windows:** avoid `winget install OpenJS.NodeJS`, which installs machine-wide and needs administrator rights. Pick one:

- fnm for your user: `winget install Schniz.fnm --scope user`, or unpack the zip from [fnm releases](https://github.com/Schniz/fnm/releases) into a folder on your user `PATH`. Then, in a new PowerShell in the app folder:

  ```powershell
  fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
  fnm install
  ```

  Add the first line to your PowerShell profile (`notepad $PROFILE`) to keep it, or run it in each new session.
- Portable zip: download the `win-x64` zip from [latest-v26.x](https://nodejs.org/dist/latest-v26.x/), compare `Get-FileHash <zip> -Algorithm SHA256` with `SHASUMS256.txt` on the same page, unpack it to a folder you own and add the inner folder holding `node.exe` to your user `PATH` (Windows search > "Edit environment variables for your account").

If PowerShell says running scripts is disabled, use `npm.cmd` instead of `npm`, or use Command Prompt. Do not weaken the execution policy to run npm.

**No local install:** [GitHub Codespaces](https://docs.github.com/en/codespaces) starts a Node 26 container from [`.devcontainer/devcontainer.json`](./.devcontainer/devcontainer.json) and forwards port 3100. GitHub is a US company: choose a European [region](https://docs.github.com/en/codespaces/setting-your-user-preferences/setting-your-default-region-for-github-codespaces) and use synthetic data only. Use the forwarded `https://<codespace-name>-3100.app.github.dev` address from the **Ports** tab instead of `localhost` in `REDIRECT_URI` and the registration.

Check with `node -v` in a new terminal.

## GitHub token

`@navikt/smart-on-fhir` is published only on [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry), which requires a token even for public packages.

1. Create a classic token with only `read:packages` at [github.com/settings/tokens/new?scopes=read:packages](https://github.com/settings/tokens/new?scopes=read:packages). Fine-grained tokens do not work with GitHub Packages for npm. Set an expiry.
2. Store it in the environment variable `NPM_AUTH_TOKEN`. [`ehr-launch/.npmrc`](./ehr-launch/.npmrc) only refers to the variable, so the token never ends up in the repo.
   - Windows: Windows search > "Edit environment variables for your account" > **New**.
   - macOS and Linux: add `export NPM_AUTH_TOKEN=<token>` to `~/.zshrc` or `~/.bashrc` with an editor.
   - Codespaces: add it as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces) and create a new codespace.
3. Open a new terminal (restart VS Code if you use its terminal).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EBADENGINE` or "Node version is not supported" | Use the version in `.nvmrc`: run `fnm use` in the folder and check `node -v` |
| `npm install` fails with `E401` and `unauthenticated` | `NPM_AUTH_TOKEN` is missing, expired or not visible in this terminal. See [GitHub token](#github-token) |
| `running scripts is disabled on this system` | Use `npm.cmd` instead of `npm` |
| `node`, `npm` or `fnm` is not recognized | Open a new terminal. If it persists, check that the install folder is on your user `PATH` |
| `SELF_SIGNED_CERT_IN_CHAIN` or `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | A corporate proxy re-signs TLS. Get the CA certificate from IT and set `NODE_EXTRA_CA_CERTS` to its path. Never disable TLS verification |
| `Configuration problem in .env` | Fix the listed variables, see the Configure section in the app README |
| `EADDRINUSE` | Another process uses the port. Stop it, or change `PORT` and `REDIRECT_URI` and update the registration |
| `invalid_client` or token endpoint 401 | Client ID, auth method, secret or public JWK Set do not match the registration |
| `SMART launch failed` | The launch `iss` differs from `FHIR_BASE_URL`. Copy the FHIR base URL exactly as the EHR sends it |
| `SMART callback failed` | Launch again from the EHR in the same browser. If it persists, check that the launch includes a patient and an encounter and that `SCOPES` includes `offline_access` |
| `No active session` | Launch from the EHR. Sessions live in server memory and expire after an hour |
| FHIR 403 | Compare `SCOPES` with the `scope` granted in the token response |

## What the apps cover

`ehr-launch/` leaves the SMART flow (discovery, PKCE, state, token exchange, ID token decoding and FHIR requests) to the library. You write the page in `src/app.ts`. `backend-services/` has no launch: `src/smart.ts` requests and caches a system token. Both target [FHIR R4](https://hl7.org/fhir/R4/).

## Norwegian context

- [HelseID](https://utviklerportal.nhn.no/informasjonstjenester/helseid) is an OAuth 2.0 and OpenID Connect authorization server, not a SMART launch. It accepts confidential clients that authenticate with `private_key_jwt`, and its APIs require DPoP. These templates do not implement DPoP, so they are not HelseID-ready.
- FNR (`urn:oid:2.16.578.1.12.4.1.4.1`) and DNR (`urn:oid:2.16.578.1.12.4.1.4.2`) are identifiers, not FHIR resource IDs. Search with `Patient?identifier=system|value`. See [Identifikatorer for personer](https://www.ehelse.no/standardisering/standarder/identifikatorer-for-personer). Use synthetic values only.
- Norwegian FHIR servers often use the [no-basis profiles](https://simplifier.net/hl7norwayno-basis) from HL7 Norway.

## What this is not

- Sessions and tokens live in server memory and are lost on restart. There is no persistent or shared storage.
- The apps run over plain HTTP on localhost. Production needs HTTPS, a persistent session store and a security review.
- `@navikt/smart-on-fhir` decodes the ID token without verifying its signature. Do not base access decisions on its claims.
- The library requires a refresh token and an encounter in the token response, so EHRs that do not send them will not work with `ehr-launch/`.

## Maintenance

[`test.yaml`](./.github/workflows/test.yaml) runs `npm ci`, tests, typecheck, format check and lint for both apps on every pull request. [Dependabot](./.github/dependabot.yml) opens weekly updates, and [`dependabot-auto-merge.yaml`](./.github/workflows/dependabot-auto-merge.yaml) enables auto-merge for minor and patch updates, following the [Nais guide](https://doc.nais.io/build/how-to/dependabot-auto-merge/). Major updates must be reviewed and merged by hand. Auto-merge waits for the checks `ehr-launch` and `backend-services`, which the default branch ruleset requires.

Both CI and Dependabot read the library with the `READER_TOKEN` secret. If you create your own repository from this template, add a classic `read:packages` token as both an Actions secret and a Dependabot secret named `READER_TOKEN`.

To move to a new Node LTS, update `.nvmrc`, `engines.node` and `@types/node` in both apps, the devcontainer image and this README, then regenerate the lockfiles. Check first that the library allows it: `npm view @navikt/smart-on-fhir engines`.

## License

[MIT](./LICENSE)
