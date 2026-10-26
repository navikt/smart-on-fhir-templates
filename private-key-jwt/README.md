# Key-pair EHR-launch starter

Token endpoint authentication `private_key_jwt`: sign a client assertion with your own private key.

## 1. Install

```sh
npm ci
```

Node 22 (`.nvmrc`).

## 2. Configure

```sh
cp .env.example .env
```

Edit `.env` and set `CLIENT_ID` to a name of your own, e.g. `yourname-key` ([.env.example](./.env.example)).

```sh
PORT=3100
FHIR_BASE_URL=https://epj.ekstern.dev.nav.no/fhir
AUTH_ISSUER=https://epj.ekstern.dev.nav.no/oidc
CLIENT_ID=yourname-key
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch patient/Patient.r patient/Encounter.s
PRIVATE_JWK_PATH=keys/private.jwk.json
```

Generate your key pair:

```sh
npm run generate-key
```

The private key stays in `keys/` on your machine and is never shared. The public key is calculated from the private key, and that is what you give the host.

Tell the host your `CLIENT_ID` and the public JWK Set it prints. Wait for the go-ahead before launching.

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

Sign a client assertion for the token request (`clientAssertion` in [src/reference.ts](./src/reference.ts)):

```json
{
  "header": { "alg": "RS384", "typ": "JWT", "kid": "<kid from your JWK>" },
  "claims": { "iss": "<client id>", "sub": "<client id>", "aud": "<token endpoint>", "jti": "<random uuid>", "exp": "<now + 2 min>" }
}
```

Keep the private JWK in `keys/` (ignored by Git).

## 6. Registration

The host registers these values for your `CLIENT_ID`. Ask the host to add scopes or a second port.

| Field | Value |
|---|---|
| Token endpoint auth | `private_key_jwt` |
| Launch URL | `http://localhost:3100/launch` |
| Redirect URL | `http://localhost:3100/callback` |
| Scopes | `openid fhirUser launch patient/Patient.r patient/Encounter.s` |

[Exercises](../EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
