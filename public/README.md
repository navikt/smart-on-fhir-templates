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

Edit `.env` and set `CLIENT_ID` to the shared hackathon client ([.env.example](./.env.example)). After a configuration error, run `npm start` again.

```sh
PORT=3100
FHIR_BASE_URL=https://epj.ekstern.dev.nav.no/fhir
AUTH_ISSUER=https://epj.ekstern.dev.nav.no/oidc
CLIENT_ID=hackathon-public
REDIRECT_URI=http://localhost:3100/callback
SCOPES=openid fhirUser launch patient/Patient.r patient/Encounter.s
```

`hackathon-public` is already registered, so there is nothing to send the host.

## 3. Start

```sh
npm start
```

`npm start` reads the `.env` file from step 2, so create it first. It restarts the app when you save a file or `.env`. A restart clears in-memory sessions and progress.

## 4. Launch

Log in at https://epj.ekstern.dev.nav.no with your own test clinician, open a patient marked "Pågår nå" and pick **Hackathon starter** in the app picker.

The page lists ten steps grouped by the [SMART App Launch](https://build.fhir.org/ig/HL7/smart-app-launch/en/app-launch.html) phases. Each step shows ✅, ❌ or ⬜ with a hint and the next action. The first launch fails at TODO 1.

## 5. Build your own

Implement the next TODO in [src/steps.ts](./src/steps.ts), then retry:

- TODO 1 to 5 failed: refresh the tab within 5 minutes of the launch.
- Later, or TODO 6 to 10: pick **Hackathon starter** in the app picker again. You do not need to close the consultation.

```ts
pkce() {
    return unfinished(3, 'Generate a random PKCE verifier and its base64url SHA-256 challenge')
},
```

Notes:

- ✅ means the output has the right shape. It is not a security certification: the checks do not prove randomness, state handling or ID token signature verification. See [Break it](./EXERCISES.md#break-it).
- Errors you throw are shown on the page. Known secret values of 8 or more characters (codes, verifiers, state, tokens) are redacted. Other text in an error is not guaranteed to be, so keep secrets out of error messages.
- Progress belongs to the browser that started the launch.
- Answers are on the `solutions` branch.

## 6. Registration

`hackathon-public` is registered for everyone with these values.

| Field | Value |
|---|---|
| Token endpoint auth | `none` |
| Launch URL | `http://localhost:3100/launch` |
| Redirect URL | `http://localhost:3100/callback` |

You can request any scope in `SCOPES` without asking the host: `openid fhirUser launch`, plus `patient/*.cruds` and `user/*.cruds` (for example `patient/Condition.s`). System scopes are not available. The launch URL, redirect URL and port are fixed: a different port or URI needs the host to register it.

[Exercises](./EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
