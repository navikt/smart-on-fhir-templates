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

`npm start` restarts the app when you save a file. A restart clears in-memory sessions and progress.

## 4. Launch

Log in at https://epj.ekstern.dev.nav.no with your own test clinician, open a patient marked "Pågår nå" and pick **Hackathon starter** in the app picker.

The page lists ten steps grouped by the [SMART App Launch](https://build.fhir.org/ig/HL7/smart-app-launch/en/app-launch.html) phases. Each step shows ✅, ❌ or ⏳ with a hint and the next action. On this branch every step is implemented, so the launch ends on the consultation page with ten ✅.

## 5. Study the solutions

This branch has every TODO in [src/steps.ts](./src/steps.ts) done. See [SOLUTIONS.md](./SOLUTIONS.md) for the walkthroughs, scopes per feature and break-it checks. To build the steps yourself, start from `main`.

Notes:

- ✅ means the output has the right shape. It is not a security certification: the checks do not prove randomness, state handling or ID token signature verification. See [Break it](./EXERCISES.md#break-it).
- Errors thrown in a step are shown on the page. Known codes, verifiers and tokens are redacted, other text is not, so keep secrets out of error messages.
- Progress belongs to the browser that started the launch, and a restart clears it.

## 6. Registration

`hackathon-public` is registered for everyone with these values.

| Field | Value |
|---|---|
| Token endpoint auth | `none` |
| Launch URL | `http://localhost:3100/launch` |
| Redirect URL | `http://localhost:3100/callback` |

You can request any scope in `SCOPES` without asking the host: `openid fhirUser launch`, plus `patient/*.cruds` and `user/*.cruds` (for example `patient/Condition.s`). System scopes are not available. The launch URL, redirect URL and port are fixed: a different port or URI needs the host to register it.

[Exercises](./EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
