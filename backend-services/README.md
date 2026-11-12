# SMART Backend Services

This system-to-system SMART Backend Services app uses `client_credentials` and a signed `private_key_jwt` assertion to obtain a system-scoped token, then searches Patient by identifier. It has no EHR launch, clinician or patient context, and does not use `@navikt/smart-on-fhir`.

Not production-ready: it runs over HTTP on localhost and holds the token in memory.

## Quickstart

Node 26 (`.nvmrc`, see [install Node](../README.md#install-node)). Node runs the TypeScript sources directly. No GitHub token is needed. In this folder:

```sh
npm ci
npm run generate-key
```

`npm run generate-key` writes the private key to `keys/private.jwk.json` (ignored by Git) and prints the public [JWK Set](https://datatracker.ietf.org/doc/html/rfc7517) (RS384, with `alg` and `kid`) for registration. It refuses to overwrite an existing key.

Register the app first; the `.env` values come from the registration. See [Register](#register).

Create `.env` here (Windows: `notepad .env`, macOS and Linux: `nano .env`) with the text below and save it as UTF-8. Keep the name `.env`, not `.env.txt`. Do not create it with `echo >` in Windows PowerShell 5.1, which writes UTF-16.

```properties
PORT=3100
FHIR_BASE_URL=paste-the-server-fhir-base-url
AUTH_ISSUER=paste-the-server-fhir-base-url
CLIENT_ID=choose-a-client-id
SCOPES=system/Patient.rs
PRIVATE_JWK_PATH=keys/private.jwk.json
PATIENT_IDENTIFIER=system|value-of-an-identifier-that-exists
```

```sh
npm start
```

Then open http://localhost:3100.

## Configure

[src/config.ts](./src/config.ts) validates the environment at startup and prints what is missing.

| Variable | Value |
|---|---|
| `PORT` | `3100` |
| `FHIR_BASE_URL` | FHIR base URL of your SMART server |
| `AUTH_ISSUER` | OIDC issuer of the SMART server. The launcher uses the same URL as `FHIR_BASE_URL` |
| `CLIENT_ID` | Client ID you registered |
| `SCOPES` | `system/Patient.rs` (system scopes only) |
| `PRIVATE_JWK_PATH` | `keys/private.jwk.json`, the exact path of the private key file |
| `PATIENT_IDENTIFIER` | `system\|value` of an identifier that exists on the server. FNR and DNR are strings, not FHIR IDs |

The [SMART Health IT launcher](https://launch.smarthealthit.org/) has synthetic US patients without FNRs. Use an identifier system and value present on those patients, or use synthetic Norwegian data from your vendor's sandbox.

## Register

In the [SMART Health IT launcher](https://launch.smarthealthit.org/) (synthetic US data only):

1. Set **FHIR Version** to `R4` and **Launch Type** to `Backend Service`.
2. Open **Client Registration & Validation**, enter your **Client ID** and paste the public JWK Set printed by `npm run generate-key`. The launcher cannot fetch a `localhost` JWKS URL, so paste the JSON.
3. Copy the generated **Server's FHIR Base URL** (it contains `/sim/<encoded>/`) into both `FHIR_BASE_URL` and `AUTH_ISSUER`. Copy it again after any change to the client ID or JWKS, because it encodes them.

The launcher steps follow its documented fields but have not been tested in a live browser. Other servers need `private_key_jwt`, your public JWK Set, the `client_credentials` grant (see the [Backend Services spec](https://hl7.org/fhir/smart-app-launch/backend-services.html)) and the scopes. No launch or redirect URL is needed. Register again after changing scopes.

## Where to add your app

- [src/smart.ts](./src/smart.ts): discovery, signed client assertion and the token request. `tokenProvider` caches the token until 30 seconds before it expires. Reuse as is.
- [src/fhir.ts](./src/fhir.ts): `searchPatients` does the one `Patient?identifier=` search. Add searches and schemas here, and the matching `system/` scopes.
- [src/app.ts](./src/app.ts): the `/` route renders the result. Replace it with your own routes.
- [src/generate-key.ts](./src/generate-key.ts): creates the RS384 key pair with `jose`.

## Test

```sh
npm test
npm run typecheck
```

`test/smoke.test.ts` generates a throwaway key in a temp directory and runs token request and search against an in-process mock server, checking the signed assertion and token reuse. It does not read `.env`.

[Troubleshooting](../README.md#troubleshooting)
