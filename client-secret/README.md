# SMART on FHIR EHR launch with a client secret

This SMART on FHIR EHR launch app authenticates to the token endpoint with `client_secret_basic`. The secret stays on the Node server. After launch, it shows the patient's name and the logged-in clinician.

This app implements SMART authorization by hand. A planned migration to `@navikt/smart-on-fhir` has not been completed. It is not production-ready: sessions are in memory and it runs over HTTP on localhost.

## Quickstart

Node 22 (`.nvmrc`, see [install Node](../docs/install-node.md)). In this folder:

```sh
npm ci
```

Create `.env` here (Windows: `notepad .env`, macOS and Linux: `nano .env`) with the text below and save it as UTF-8. Keep the name `.env`, not `.env.txt`. Do not create it with `echo >` in Windows PowerShell 5.1, which writes UTF-16. Choose your own client ID and secret.

```properties
PORT=3100
FHIR_BASE_URL=https://launch.smarthealthit.org/v/r4/fhir
AUTH_ISSUER=https://launch.smarthealthit.org/v/r4/fhir
CLIENT_ID=choose-a-client-id
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch patient/Patient.r patient/Encounter.s
CLIENT_SECRET=choose-a-long-random-secret
```

```sh
npm start
```

Then register and launch the app in the [SMART Health IT launcher](https://launch.smarthealthit.org/), as described in [Register](#register).

## Configure

[src/config.ts](./src/config.ts) validates the environment at startup and prints what is missing.

| Variable | Value |
|---|---|
| `PORT` | `3100` |
| `FHIR_BASE_URL` | FHIR base URL of the EHR. The launch `iss` must match it exactly, so copy the `iss` from the error if it differs |
| `AUTH_ISSUER` | OIDC issuer of the EHR, used to verify the ID token. The launcher uses the same URL as `FHIR_BASE_URL` |
| `CLIENT_ID` | Client ID you registered |
| `REDIRECT_URI` | `http://localhost:3100/callback`. In Codespaces use `https://<codespace-name>-3100.app.github.dev/callback` |
| `SCOPES` | `openid fhirUser launch patient/Patient.r patient/Encounter.s` |
| `CLIENT_SECRET` | Secret you registered |

## Register

In the [SMART Health IT launcher](https://launch.smarthealthit.org/) (synthetic US data only):

1. Set **FHIR Version** to `R4` and the launch type to a provider EHR launch.
2. **App's Launch URL**: `http://localhost:3100/launch` (in Codespaces, the `https://<codespace-name>-3100.app.github.dev/launch` URL).
3. Open **Client Registration & Validation**. Set **Client Identity Validation** to `STRICT` and **Client Type** to `Confidential Symmetric`.
4. Enter the `.env` **Client ID** and **Client Secret**. Set the allowed redirect URI to `http://localhost:3100/callback`, or to the Codespaces `/callback` URL when using Codespaces.
5. Pick a patient and clinician, then launch. Changing scopes, port or redirect URI means updating the registration too.

Loose validation does not check the client, so a successful launch does not verify the secret. Keep `STRICT`. For other SMART servers, register the same `client_secret_basic` method, launch URL, redirect URL and scopes.
## Where to add your app

- [src/smart.ts](./src/smart.ts): launch, [PKCE](https://datatracker.ietf.org/doc/html/rfc7636) and state, code exchange with Basic credentials, ID token verification. Reuse as is.
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
