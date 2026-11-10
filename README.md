# SMART on FHIR templates

Starting points for [SMART on FHIR](https://hl7.org/fhir/smart-app-launch/) apps in Node and TypeScript. These are templates for learning and prototyping, not production code. See [What this is not](#what-this-is-not).

| Folder | Flow | Client authentication | Node |
|---|---|---|---|
| [backend-services/](./backend-services/) | `client_credentials`, no user | `private_key_jwt` | 26 |
| [client-secret/](./client-secret/) | EHR launch | `client_secret_basic` | 22 |
| [private-key-jwt/](./private-key-jwt/) | EHR launch | `private_key_jwt` | 22 |

The two EHR launch folders implement SMART authorization by hand. Their planned replacement is a single `ehr-launch` app built on [`@navikt/smart-on-fhir`](https://github.com/navikt/smart-on-fhir). That migration is not done yet, so the folders above are what exists today.

## Get started

1. Install Node and npm, see [docs/install-node.md](./docs/install-node.md) (macOS, Linux, Windows, Codespaces).
2. Click **Use this template** > **Create a new repository**, then clone it.
3. Pick a folder and follow its README. For example:

   ```sh
   cd backend-services
   npm ci
   npm run generate-key
   ```

   Then create `.env` as the folder README describes and run `npm start`.

4. You need a SMART server to talk to. The public [SMART Health IT launcher](https://launch.smarthealthit.org/) serves synthetic data and needs no registration for its simulated flows. Never use real patient data in a third-party tool.

`.env` and `keys/` are in `.gitignore`, so secrets stay out of your repo.

## How the folders compare

`client-secret/` and `private-key-jwt/` share one structure: `src/smart.ts` holds launch, PKCE, state, token exchange and ID token verification, `src/app.ts` the routes, `src/fhir.ts` the FHIR calls. They differ only in how the token request authenticates (`exchange` and `clientAssertion` in `src/smart.ts`) and in config. `backend-services/` has no launch: `src/smart.ts` requests and caches a system token.

## Norwegian context

- [HelseID](https://utviklerportal.nhn.no/informasjonstjenester/helseid) is not a SMART launch. It is a confidential client with `private_key_jwt` and DPoP. `@navikt/smart-on-fhir` has no DPoP support, so these templates are not HelseID-ready.
- FNR and DNR are string identifiers (a system and a value), not FHIR resource IDs. Search with `identifier=system|value`.
- Profiles without a legal basis for sharing need a data processing or vendor agreement before any real use.

## What this is not

- Sessions and tokens live in server memory and are lost on restart. There is no persistent or shared storage.
- The apps run over plain HTTP on localhost. Production needs HTTPS, a persistent session store and a security review.
- `@navikt/smart-on-fhir` is under active development, so expect breaking changes.

## More

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md): common errors
- [docs/install-node.md](./docs/install-node.md): installing Node on each platform
- [docs/github-packages-token.md](./docs/github-packages-token.md): token for GitHub Packages
- [docs/maintaining.md](./docs/maintaining.md): CI, Dependabot and Node upgrades
