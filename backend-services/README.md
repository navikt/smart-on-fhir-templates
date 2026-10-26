# Backend Services starter

System-to-system app with `client_credentials`. It has no EHR launch, clinician or patient context.

## 1. Install

```sh
npm ci
```

Node 22 (`.nvmrc`).

## 2. Configure

```sh
cp .env.example .env
```

Edit `.env` and set `CLIENT_ID` to a name of your own, e.g. `yourname-backend` ([.env.example](./.env.example)).

```sh
PORT=3100
FHIR_BASE_URL=https://epj.ekstern.dev.nav.no/fhir
AUTH_ISSUER=https://epj.ekstern.dev.nav.no/oidc
CLIENT_ID=yourname-backend
SCOPES=system/Patient.rs
PRIVATE_JWK_PATH=keys/private.jwk.json
PATIENT_IDENTIFIER=urn:oid:2.16.578.1.12.4.1.4.1|20856210112
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

## 4. Open the app

Open http://localhost:3100 and follow the search link.

## 5. Build your own

Implement the TODOs in [src/steps.ts](./src/steps.ts), then run `npm start`.

```ts
async backendSearch(config, tokens) {
  return unfinished(3, "Search Patient by the supplied synthetic identifier using the server-side bearer token");
},
```

The matching function is `backendSearch` in [src/reference.ts](./src/reference.ts).

Sign a client assertion for the token request (`clientAssertion` in [src/reference.ts](./src/reference.ts)):

```json
{
  "header": { "alg": "RS384", "typ": "JWT", "kid": "<kid from your JWK>" },
  "claims": { "iss": "<client id>", "sub": "<client id>", "aud": "<token endpoint>", "jti": "<random uuid>", "exp": "<now + 2 min>" }
}
```

Keep the private JWK in `keys/` (ignored by Git).

## 6. Registration

The host registers these values for your `CLIENT_ID`. It has no launch or redirect URL.

| Field | Value |
|---|---|
| Token endpoint auth | `private_key_jwt` with your public JWK |
| Grant type | `client_credentials` |
| Scopes | `system/Patient.rs` |

[Exercises](../EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
