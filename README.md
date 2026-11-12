# SMART on FHIR templates

Templates for learning and prototyping [SMART on FHIR](https://hl7.org/fhir/smart-app-launch/) apps in Node and TypeScript. See [What this is not](#what-this-is-not).

| Folder | Flow | Client authentication | Node |
|---|---|---|---|
| [ehr-launch/](./ehr-launch/) | EHR launch with patient and encounter context | `none`, `client_secret_basic` or `private_key_jwt`, set in `.env` | 24 |
| [backend-services/](./backend-services/) | `client_credentials`, no user | `private_key_jwt` | 24 |

`ehr-launch/` uses [`@navikt/smart-on-fhir`](https://github.com/navikt/smart-on-fhir), a library under active development. `backend-services/` implements the token request itself because the library does not support `client_credentials`. Installing the library requires a [GitHub token](./docs/github-packages-token.md). Both apps move to Node 26 LTS once the library supports it.

## Get started

Start with `ehr-launch/` and the `client_secret_basic` method. Its setup is shorter than the key-based one.

1. Install Node and npm, see [docs/install-node.md](./docs/install-node.md) (macOS, Linux, Windows, Codespaces).
2. Create a [GitHub token](./docs/github-packages-token.md) so npm can install the library.
3. Get the code. Download the ZIP from the repository page with **Code** > **Download ZIP**, then extract it. Or choose **Use this template** > **Create a new repository**, then clone it.
4. Open a terminal in the app folder. On Windows, open PowerShell from Windows search and `cd` into the extracted folder, for example `cd $HOME\Downloads\smart-on-fhir-templates-main\ehr-launch`.
5. Run `npm install` (if PowerShell says running scripts is disabled, run `npm.cmd install`), then create `.env` with the text from the [ehr-launch README](./ehr-launch/README.md#configure). On Windows, run `notepad .env` and confirm creation. On macOS and Linux, run `nano .env`. Save as UTF-8. In Notepad, choose **All Files** so the file is named `.env`, not `.env.txt`. Avoid `echo >` in Windows PowerShell 5.1; it writes UTF-16, which Node cannot read.
6. Run `npm start`, then register the app in the [SMART Health IT launcher](https://launch.smarthealthit.org/) as described in the README. The launcher uses synthetic US data. Do not enter real patient data. The registration steps are based on the launcher's source code and have not been tested in a browser.

`.env` and `keys/` are in `.gitignore`, so secrets stay out of your repo. For `backend-services/`, follow its [README](./backend-services/README.md). It does not need a GitHub token, but it does need a key pair and a registered client.

## What the apps cover

`ehr-launch/` leaves the SMART flow (discovery, PKCE, state, token exchange, ID token decoding and FHIR requests) to the library. You write the page in `src/app.ts`. `backend-services/` has no launch: `src/smart.ts` requests and caches a system token. Both target [FHIR R4](https://hl7.org/fhir/R4/).

## Norwegian context

- [HelseID](https://utviklerportal.nhn.no/informasjonstjenester/helseid) is an OAuth 2.0 and OpenID Connect authorization server, not a SMART launch. It accepts confidential clients that authenticate with `private_key_jwt`, and its APIs require DPoP. These templates do not implement DPoP, so they are not HelseID-ready.
- FNR and DNR are string identifiers (a system and a value), not FHIR resource IDs. Search with `identifier=system|value`. The identifier systems are listed in [Identifikatorer for personer](https://www.ehelse.no/standardisering/standarder/identifikatorer-for-personer).
- Norwegian FHIR servers often use the [no-basis profiles](https://simplifier.net/hl7norwayno-basis) from HL7 Norway.

## What this is not

- Sessions and tokens live in server memory and are lost on restart. There is no persistent or shared storage.
- The apps run over plain HTTP on localhost. Production needs HTTPS, a persistent session store and a security review.
- `@navikt/smart-on-fhir` decodes the ID token without verifying its signature. Do not base access decisions on its claims.
- The library requires a refresh token and an encounter in the token response, so EHRs that do not send them will not work with `ehr-launch/`.

## More

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md): common errors
- [docs/install-node.md](./docs/install-node.md): installing Node on each platform
- [docs/github-packages-token.md](./docs/github-packages-token.md): token for installing the library
- [docs/maintaining.md](./docs/maintaining.md): CI, Dependabot and Node upgrades
