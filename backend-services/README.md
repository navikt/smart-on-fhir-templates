# SMART Backend Services

A system-to-system SMART Backend Services app. It authenticates with `client_credentials` and a signed `private_key_jwt` assertion, then searches Patient by identifier with a system-scoped token. There is no EHR launch, clinician or patient context. It has no dependency on `@navikt/smart-on-fhir`.

Not production-ready: it runs over HTTP on localhost and holds the token in memory.

## Quickstart

Node 26 (`.nvmrc`, see [install Node](../docs/install-node.md)). Node runs the TypeScript sources directly.

```sh
npm ci
npm run generate-key
```

`npm run generate-key` writes the private key to `keys/private.jwk.json` (ignored by Git) and prints the public JWK Set. Register that with your SMART server (RS384, with `alg` and `kid`). It refuses to overwrite an existing key.

Create `.env` in this folder with the text below, saved as UTF-8 (in Windows PowerShell 5.1 use an editor, because `echo >` writes UTF-16). Replace the placeholders.

```properties
PORT=3100
FHIR_BASE_URL=https://ehr.example.org/fhir
AUTH_ISSUER=https://ehr.example.org/oidc
CLIENT_ID=replace-with-your-client-id
SCOPES=system/Patient.rs
PRIVATE_JWK_PATH=keys/private.jwk.json
PATIENT_IDENTIFIER=urn:oid:2.16.578.1.12.4.1.4.1|replace-with-a-synthetic-fnr
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
| `AUTH_ISSUER` | OIDC issuer of the SMART server |
| `CLIENT_ID` | Client ID registered for your app |
| `SCOPES` | `system/Patient.rs` (system scopes only) |
| `PRIVATE_JWK_PATH` | `keys/private.jwk.json` |
| `PATIENT_IDENTIFIER` | `system\|value`, a synthetic identifier. FNR and DNR are strings, not FHIR IDs |

On the [SMART Health IT launcher](https://launch.smarthealthit.org/), copy the generated FHIR URL (`.../sim/<encoded>/...`) from the launcher as `FHIR_BASE_URL`. Do not expect a given FNR to match a patient in its synthetic data.

## Register

Register the app with your SMART server and wait for it to be active before running. There is no launch or redirect URL. Changing scopes means registering again.

| Field | Value |
|---|---|
| Token endpoint auth | `private_key_jwt` with your public JWK |
| Grant type | `client_credentials` |
| Scopes | same as `SCOPES` |

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

[Troubleshooting](../TROUBLESHOOTING.md)
