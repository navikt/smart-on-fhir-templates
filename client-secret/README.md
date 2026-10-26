# Client-secret EHR-launch starter

Token endpoint authentication `client_secret_basic`. The secret stays on the Node server.

## 1. Install

```sh
npm ci
```

Node 22 (`.nvmrc`).

## 2. Configure

Put the `.env` from your team packet in this folder, or `cp .env.example .env` and fill in ([.env.example](./.env.example)).

```sh
PORT=3100
FHIR_BASE_URL=https://epj.ekstern.dev.nav.no/fhir
AUTH_ISSUER=https://epj.ekstern.dev.nav.no/oidc
CLIENT_ID=your-client-id
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch patient/Patient.r patient/Encounter.s
CLIENT_SECRET=your-client-secret
```

## 3. Run the reference

```sh
npm run start:reference
```

## 4. Launch

Log in at https://epj.ekstern.dev.nav.no, open a patient marked "Pågår nå" and pick your app.

## 5. Build your own

Implement the TODOs in [src/steps.ts](./src/steps.ts), then run `npm start`.

```ts
pkce() {
  return unfinished(3, "Generate a random PKCE verifier and its base64url SHA-256 challenge");
},
```

The matching function is `pkce` in [src/reference.ts](./src/reference.ts).

Send the secret as HTTP Basic auth in the token request (`tokenRequest` in [src/reference.ts](./src/reference.ts)):

```http
POST <token endpoint>
Authorization: Basic base64(client_id:client_secret)
```

## 6. Registration

The host registers this for you. Compare it with your packet.

```json
{
  "tokenEndpointAuthMethod": "client_secret_basic",
  "launchUri": "http://localhost:3100/launch",
  "redirectUris": ["http://localhost:3100/callback"],
  "launchMode": "tab",
  "grantTypes": ["authorization_code"],
  "scopes": ["openid", "fhirUser", "launch", "patient/Patient.r", "patient/Encounter.s"]
}
```

[Exercises](../EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
