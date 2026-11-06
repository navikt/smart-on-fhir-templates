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
- Answers are on the `solutions` branch. See [Stuck?](#stuck) before you open it.

## Stuck?

Three levels, in order. Each one gives away more of the learning, so stop at the first that unblocks your team.

1. **Hint and why.** A ❌ step on the checklist shows a hint, why the step exists (the attack or failure it prevents) and a link to the SMART spec. Read the why aloud to your team.
2. **Copy one step.** Open [`steps.ts` on `solutions`](https://github.com/navikt/smart-on-fhir-templates/blob/solutions/public/src/steps.ts), find the function named like your ❌ step (for example `pkce()`) and compare it with yours before you paste it into your own `src/steps.ts`.
3. **Use the solved app.** Your repo has no `solutions` branch, so fetch it from the upstream repo. Run these in this folder (`public/`). Pick one:

   Replace only `src/steps.ts`. Your copy is kept in `steps.mine.txt`:

   ```sh
   cp src/steps.ts steps.mine.txt
   git fetch https://github.com/navikt/smart-on-fhir-templates solutions
   git checkout FETCH_HEAD -- src/steps.ts
   ```

   Undo it with `cp steps.mine.txt src/steps.ts`.

   Or run the whole solved app next to yours, including the write-back pages, and leave your own `public/` untouched:

   ```sh
   git fetch https://github.com/navikt/smart-on-fhir-templates solutions
   git worktree add ../../smart-solved FETCH_HEAD
   cp .env ../../smart-solved/public/.env
   cd ../../smart-solved/public
   npm ci
   ```

   Stop your own app first. The launch URL and port 3100 are registered once, so only one app can run at a time. Then run `npm start` in `smart-solved/public`.

## Skip Bronze and pacing

- **Experienced with SMART?** Skip Bronze: set up the solved app as in level 3 and build from there. You still work through the discussion prompts. The checklist shows them as "Before you build" after a launch with ten ✅, and the [solutions guide](https://github.com/navikt/smart-on-fhir-templates/blob/solutions/public/SOLUTIONS.md) explains each step.
- **Not through Bronze before lunch?** Set up the solved app as in level 3 and build after lunch. Nobody checks, so the team decides.

## 6. Registration

`hackathon-public` is registered for everyone with these values.

| Field | Value |
|---|---|
| Token endpoint auth | `none` |
| Launch URL | `http://localhost:3100/launch` |
| Redirect URL | `http://localhost:3100/callback` |

You can request any scope in `SCOPES` without asking the host: `openid fhirUser launch`, plus `patient/*.cruds` and `user/*.cruds` (for example `patient/Condition.s`). System scopes are not available. The launch URL, redirect URL and port are fixed: a different port or URI needs the host to register it.

[Exercises](./EXERCISES.md) · [Troubleshooting](../TROUBLESHOOTING.md)
