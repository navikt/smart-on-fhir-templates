# SMART on FHIR EHR launch with a client secret

A SMART on FHIR EHR launch app that authenticates to the token endpoint with `client_secret_basic`, with the secret kept on the Node server. After launch it shows the patient's name and the logged-in clinician.

This app implements SMART authorization by hand and is due to be replaced by an app built on `@navikt/smart-on-fhir`. That migration is not done yet. Not production-ready: sessions are in memory and the app runs over HTTP on localhost.

## Quickstart

Node 22 (`.nvmrc`, see [install Node](../docs/install-node.md)).

```sh
npm ci
```

Create `.env` in this folder with the text below, saved as UTF-8 (in Windows PowerShell 5.1 use an editor, because `echo >` writes UTF-16). Replace the placeholders.

```properties
PORT=3100
FHIR_BASE_URL=https://ehr.example.org/fhir
AUTH_ISSUER=https://ehr.example.org/oidc
CLIENT_ID=replace-with-your-client-id
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch patient/Patient.r patient/Encounter.s
CLIENT_SECRET=replace-with-your-client-secret
```

```sh
npm start
```

Then launch the app from your SMART server (EHR). It opens `http://localhost:3100/launch` with `iss` and `launch` parameters.

## Configure

[src/config.ts](./src/config.ts) validates the environment at startup and prints what is missing.

| Variable | Value |
|---|---|
| `PORT` | `3100` |
| `FHIR_BASE_URL` | FHIR base URL of your SMART server. The launch `iss` must match it exactly |
| `AUTH_ISSUER` | OIDC issuer of the SMART server, used to verify the ID token |
| `CLIENT_ID` | Client ID registered for your app |
| `REDIRECT_URI` | `http://localhost:3100/callback` |
| `SCOPES` | `openid fhirUser launch patient/Patient.r patient/Encounter.s` |
| `CLIENT_SECRET` | Secret registered for your app |

## Register

Register the app with your SMART server and wait for it to be active before launching. Changing scopes, port or redirect URI means registering again.

| Field | Value |
|---|---|
| Token endpoint auth | `client_secret_basic` |
| Launch URL | `http://localhost:3100/launch` |
| Redirect URL | `http://localhost:3100/callback` |
| Scopes | same as `SCOPES` |

## Where to add your app

- [src/smart.ts](./src/smart.ts): launch, PKCE and state, code exchange with Basic credentials, ID token verification. Reuse as is.
- [src/app.ts](./src/app.ts): the `/` route fetches the launched patient and renders the name. Replace it with your own page.
- [src/fhir.ts](./src/fhir.ts): `fhirGet` sends the access token to the configured FHIR server. Add schemas and calls here.

The session is held in server memory and lasts at most as long as the access token. There is no refresh: after expiry, launch again from the EHR. Request more scopes in `SCOPES` and in the registration before reading more resources.

## Test

```sh
npm test
npm run typecheck
```

`test/smoke.test.ts` runs launch, callback and the patient page against an in-process mock server. It does not read `.env`.

[Troubleshooting](../TROUBLESHOOTING.md)
