# Key-pair EHR-launch starter

Token endpoint authentication `private_key_jwt`: sign a client assertion with the private key from your packet.

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
PRIVATE_JWK_PATH=keys/launch-key.private.jwk.json
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

Sign a client assertion for the token request (`clientAssertion` in [src/reference.ts](./src/reference.ts)):

```json
{
  "header": { "alg": "RS384", "typ": "JWT", "kid": "<kid from your JWK>" },
  "claims": { "iss": "<client id>", "sub": "<client id>", "aud": "<token endpoint>", "jti": "<random uuid>", "exp": "<now + 2 min>" }
}
```

Keep the private JWK in `keys/` (ignored by Git).

## 6. Registration

The host registers this for you. Compare it with your packet.

```json
{
  "tokenEndpointAuthMethod": "private_key_jwt",
  "jwkSet": { "keys": ["<your public JWK>"] },
  "launchUri": "http://localhost:3100/launch",
  "redirectUris": ["http://localhost:3100/callback"],
  "launchMode": "tab",
  "grantTypes": ["authorization_code"],
  "scopes": ["openid", "fhirUser", "launch", "patient/Patient.r", "patient/Encounter.s"]
}
```

[Exercises](../EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
