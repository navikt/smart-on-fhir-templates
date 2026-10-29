# Public EHR-launch starter

Token endpoint authentication `none`: PKCE is the proof, no secret or key.

## 1. Install

```sh
npm ci
```

Node 22 (`.nvmrc`).

## 2. Configure

```sh
cp .env.example .env
```

Edit `.env` and set `CLIENT_ID` to a name of your own, e.g. `yourname-public` ([.env.example](./.env.example)).

```sh
PORT=3100
FHIR_BASE_URL=https://epj.ekstern.dev.nav.no/fhir
AUTH_ISSUER=https://epj.ekstern.dev.nav.no/oidc
CLIENT_ID=yourname-public
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch patient/Patient.r patient/Encounter.s
```

Tell the host your `CLIENT_ID` and that you use the public variant. Wait for the go-ahead before launching.

## 3. Run the reference

```sh
npm run start:reference
```

## 4. Launch

Log in at https://epj.ekstern.dev.nav.no with your own test clinician, open a patient marked "Pågår nå" and pick your app.

## 5. Build your own

Implement the TODOs in [src/steps.ts](./src/steps.ts), then run `npm start`.

```ts
pkce() {
  return unfinished(3, "Generate a random PKCE verifier and its base64url SHA-256 challenge");
},
```

The matching function is `pkce` in [src/reference.ts](./src/reference.ts).

## 6. Registration

The host registers these values for your `CLIENT_ID`. Ask the host to add scopes or a second port.

| Field | Value |
|---|---|
| Token endpoint auth | `none` |
| Launch URL | `http://localhost:3100/launch` |
| Redirect URL | `http://localhost:3100/callback` |
| Scopes | `openid fhirUser launch patient/Patient.r patient/Encounter.s` |

[Exercises](./EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
