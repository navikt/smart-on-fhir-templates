# SMART on FHIR templates

Templates for learning and prototyping [SMART on FHIR](https://hl7.org/fhir/smart-app-launch/) apps in Node and TypeScript, not production use. See [What this is not](#what-this-is-not).

| Folder | Flow | Client authentication | Node |
|---|---|---|---|
| [backend-services/](./backend-services/) | `client_credentials`, no user | `private_key_jwt` | 26 |
| [client-secret/](./client-secret/) | EHR launch | `client_secret_basic` | 22 |
| [private-key-jwt/](./private-key-jwt/) | EHR launch | `private_key_jwt` | 22 |

The EHR launch folders implement SMART authorization by hand. A single `ehr-launch` app built on [`@navikt/smart-on-fhir`](https://github.com/navikt/smart-on-fhir) is planned to replace them, but that app is not implemented.

## Get started

Start with `client-secret/`. Its setup is shorter than the key-based apps.

1. Install Node and npm, see [docs/install-node.md](./docs/install-node.md) (macOS, Linux, Windows, Codespaces).
2. Get the code. Download the ZIP from the repository page with **Code** > **Download ZIP**, then extract it. Or choose **Use this template** > **Create a new repository**, then clone it.
3. Open a terminal in the app folder. On Windows, open PowerShell from Windows search and `cd` into the extracted folder, for example `cd $HOME\Downloads\smart-on-fhir-templates-main\client-secret`.
4. Install dependencies:

   ```sh
   npm ci
   ```

   Create `.env` with the text from the folder README. On Windows, run `notepad .env` and confirm creation. On macOS and Linux, run `nano .env`. Save as UTF-8. In Notepad, choose **All Files** so the file is named `.env`, not `.env.txt`. Avoid `echo >` in Windows PowerShell 5.1; it writes UTF-16, which Node cannot read.

5. Run `npm start`, then register the app in the [SMART Health IT launcher](https://launch.smarthealthit.org/) as described in its folder README. The launcher uses synthetic US data. Do not enter real patient data. Its documented registration steps have not been verified in a live browser.

`.env` and `keys/` are in `.gitignore`, so secrets stay out of your repo.

## How the folders compare

`client-secret/` and `private-key-jwt/` share a structure. In both, `src/smart.ts` handles launch, PKCE, state, token exchange and ID token verification; `src/app.ts` defines routes; `src/fhir.ts` makes FHIR calls. They differ in token-request authentication (`exchange` and `clientAssertion` in `src/smart.ts`) and configuration. `backend-services/` has no launch; `src/smart.ts` requests and caches a system token. All three target [FHIR R4](https://hl7.org/fhir/R4/).

## Norwegian context

- [HelseID](https://utviklerportal.nhn.no/informasjonstjenester/helseid) is an OAuth 2.0 and OpenID Connect authorization server, not a SMART launch. It accepts confidential clients that authenticate with `private_key_jwt`, and its APIs require DPoP. These templates do not implement DPoP, so they are not HelseID-ready.
- FNR and DNR are string identifiers (a system and a value), not FHIR resource IDs. Search with `identifier=system|value`. The identifier systems are listed in [Identifikatorer for personer](https://www.ehelse.no/standardisering/standarder/identifikatorer-for-personer).
- Norwegian FHIR servers often use the [no-basis profiles](https://simplifier.net/hl7norwayno-basis) from HL7 Norway.

## What this is not

- Sessions and tokens live in server memory and are lost on restart. There is no persistent or shared storage.
- The apps run over plain HTTP on localhost. Production needs HTTPS, a persistent session store and a security review.

## More

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md): common errors
- [docs/install-node.md](./docs/install-node.md): installing Node on each platform
- [docs/maintaining.md](./docs/maintaining.md): CI, Dependabot and Node upgrades
