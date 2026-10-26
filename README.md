# SMART on FHIR hackathon starters

Starter apps for building a SMART on FHIR app and launching it in nav-epj.

## Get started

1. Click **Use this template** > **Create a new repository**, and create a public or private repo under your own GitHub account.
2. Clone it and open it in your editor:

   ```sh
   git clone https://github.com/<you>/<your-repo>.git
   cd <your-repo>
   ```

3. Pick the folder that matches your team packet:

   | Folder | Client auth | Use when |
   |---|---|---|
   | [public/](./public/) | `none` | Your registration has no secret or key |
   | [client-secret/](./client-secret/) | `client_secret_basic` | Your packet has a `CLIENT_SECRET` |
   | [private-key-jwt/](./private-key-jwt/) | `private_key_jwt` | Your packet has a private JWK |
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

## Maintainers

Edit shared files in `public/`, then propagate them:

```sh
node scripts/sync-common.mjs
```

CI fails on drift. In a variant, `npm test` and `npm run typecheck` check the reference code against a local mock.
