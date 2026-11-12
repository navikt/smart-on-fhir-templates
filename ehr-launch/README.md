# SMART on FHIR EHR launch

This SMART on FHIR app is launched by a clinician from an EHR. It displays the patient's name and uses [`@navikt/smart-on-fhir`](https://github.com/navikt/smart-on-fhir) for authorization and FHIR requests.

Not production-ready: sessions are held in server memory, and the app runs over HTTP on localhost. The library decodes the ID token without verifying its signature; do not base access decisions on its claims. The library is under active development, and its version is pinned in `package.json`. See [the library docs](https://navikt.github.io/smart-on-fhir/).

## Prerequisites

- Node 24, see [install Node](../docs/install-node.md).
- A GitHub token to install the library, because it is published only on GitHub Packages. See [GitHub Packages token](../docs/github-packages-token.md).

## Install

In this folder:

```sh
npm install
```

If PowerShell says running scripts is disabled, use `npm.cmd install` (and `npm.cmd start` below). If it fails with 401, the token is missing in this terminal, see [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

## Configure

Create `.env` in this folder with an editor. On Windows run `notepad .env` and choose **Yes** to create it. On macOS and Linux run `nano .env`. Save as UTF-8 and keep the name `.env`, not `.env.txt`. Do not use `echo >` in Windows PowerShell 5.1, which writes UTF-16.

```properties
PORT=3100
FHIR_BASE_URL=https://launch.smarthealthit.org/v/r4/fhir
CLIENT_ID=choose-a-client-id
CLIENT_AUTH_METHOD=client_secret_basic
CLIENT_SECRET=choose-a-long-random-secret
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch launch/patient launch/encounter patient/Patient.rs offline_access
```

[src/config.ts](./src/config.ts) validates the environment at startup and prints what is missing.

| Variable | Required | Value |
|---|---|---|
| `FHIR_BASE_URL` | yes | The FHIR base URL of the EHR you trust. The launch `iss` must match it exactly. HTTP is allowed only on localhost |
| `CLIENT_ID` | yes | Client ID you registered |
| `CLIENT_AUTH_METHOD` | yes | `none`, `client_secret_basic` or `private_key_jwt` |
| `CLIENT_SECRET` | with `client_secret_basic` | Secret you registered |
| `PRIVATE_JWK_PATH` | with `private_key_jwt` | Private key file, default `keys/private.jwk.json` |
| `REDIRECT_URI` | no | Default `http://localhost:3100/callback`. In Codespaces use `https://<codespace-name>-3100.app.github.dev/callback` |
| `PORT` | no | Default `3100` |
| `SCOPES` | no | Default as above |

The library requires an encounter and a refresh token in the token response. Keep `launch/encounter` and `offline_access` in `SCOPES`.

There is no issuer setting. The library finds the authorization server from the EHR's SMART discovery document.

### Client authentication

- `none`: a public client. No secret, so anyone who knows the client ID can use it. Use only where the EHR allows it.
- `client_secret_basic`: the token request sends `CLIENT_ID` and `CLIENT_SECRET` as HTTP Basic credentials. The secret stays on the server.
- `private_key_jwt`: the token request carries a JWT signed with your private key. Create the key once:

  ```sh
  npm run generate-key
  ```

  It writes the private key to `keys/private.jwk.json` (ignored by Git) and prints the public [JWK Set](https://datatracker.ietf.org/doc/html/rfc7517) (RS384, with `alg` and `kid`). Register that public key with the EHR. It refuses to overwrite an existing key. Set `CLIENT_AUTH_METHOD=private_key_jwt` and remove `CLIENT_SECRET`.

## Run and register

```sh
npm start
```

Register the app in the [SMART Health IT launcher](https://launch.smarthealthit.org/) (synthetic US data only, never real patient data). Keep `npm start` running in its terminal.

1. Set **FHIR Version** to `R4` and **Launch Type** to the provider EHR launch.
2. **App's Launch URL**: `http://localhost:3100/launch`. In Codespaces use `https://<codespace-name>-3100.app.github.dev/launch`.
3. Open **Client Registration & Validation**. Set **Client Identity Validation** to **Strict**.
4. Set **Client Type** to match `CLIENT_AUTH_METHOD`: **Public** for `none`, **Confidential Symmetric** for `client_secret_basic` (same **Client ID** and **Client Secret** as `.env`) or **Confidential Asymmetric** for `private_key_jwt` (same **Client ID**, and paste the public JWK Set into **JWKS**, because the launcher cannot fetch a `localhost` JWKS URL).
5. In **Allowed Redirect URIs**, enter `http://localhost:3100/callback` (the Codespaces `/callback` URL in Codespaces).
6. Under **Patient(s)** pick a patient, and under **Encounter** choose to select the most recent encounter. Without an encounter the token response lacks one and the library rejects it.
7. Click **Launch**. The app should show the patient's name.

**Loose** validation does not check the client, so a successful launch does not verify your credentials. These steps follow the launcher's source code but have not been tested in a browser. Other SMART servers need the same registration details: launch URL, redirect URL, scopes and client credentials. Update the registration whenever these change.

## Routes

| Route | What it does |
|---|---|
| `GET /launch` | Entry point the EHR opens with `iss` and `launch`. Rejects an `iss` other than `FHIR_BASE_URL`, then redirects to the EHR login |
| `GET /callback` | Receives the code and state, exchanges them for tokens and redirects to `/` |
| `GET /` | Shows the patient's name. Returns 401 without a session |

## How it works

[src/app.ts](./src/app.ts) creates a new `SmartClient` for every request and calls `launch`, `callback` and `ready`. [src/config.ts](./src/config.ts) lists the one trusted FHIR server (`knownFhirServers`) with its client authentication. Every launch gets a new random session ID in an HttpOnly, SameSite=Lax cookie (`Secure` when `REDIRECT_URI` is HTTPS). [src/storage.ts](./src/storage.ts) keeps session data in memory, for one hour and at most 1000 entries. Add your own page in the `/` route, and request more scopes in `SCOPES` and in the registration before reading more resources.

## Test

```sh
npm test
npm run typecheck
npm run fmt:check
npm run lint
```

The tests run launch, callback and the patient page against a local mock server for each client authentication method. They do not read `.env`.

[Troubleshooting](../TROUBLESHOOTING.md)
