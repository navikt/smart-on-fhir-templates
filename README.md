# SMART on FHIR hackathon starters

Starter apps for building a SMART on FHIR app and launching it in nav-epj.

## Before you start

1. Get your own test clinician login from the host. Use one login per person.
2. The host registers every app by hand in nav-epj. Your folder's README tells you what to send the host (client ID, plus a secret or public key) and when.

## Get started

1. Click **Use this template** > **Create a new repository**, and create a public or private repo under your own GitHub account.
2. Clone it and open it in your editor:

   ```sh
   git clone https://github.com/<you>/<your-repo>.git
   cd <your-repo>
   ```

3. Pick the folder for the auth type you want to try:

   | Folder | Client auth | Use when |
   |---|---|---|
   | [public/](./public/) | `none` | Simplest: no secret or key, PKCE only |
   | [client-secret/](./client-secret/) | `client_secret_basic` | You pick a `CLIENT_SECRET` |
   | [private-key-jwt/](./private-key-jwt/) | `private_key_jwt` | You generate a key pair with `npm run generate-key` |
   | [backend-services/](./backend-services/) | `private_key_jwt` + `client_credentials` | You build a system-to-system app without EHR launch |

4. Follow the README in that folder. The short version:

   ```sh
   cd public
   npm ci
   cp .env.example .env
   npm run start:reference
   ```

`.env` and `keys/` are in `.gitignore`, so your secrets stay out of your repo.

- [EXERCISES.md](./EXERCISES.md): Bronze, Silver and Gold ideas
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md): errors and test patients
- [Published track](https://hl7norway.github.io/Norwegian-FHIR-Hackathon-2026/currentbuild/smart-track.html)
