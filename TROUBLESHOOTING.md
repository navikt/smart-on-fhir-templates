# Troubleshooting

| Symptom | Fix |
|---|---|
| `Configuration problem in .env` | Fix the listed variables, see the Configure step in your folder's README |
| `npm ci`, `npm install` or `npm start` says the Node version is not supported | Use the version in the folder's `.nvmrc`, see [docs/install-node.md](./docs/install-node.md) |
| `npm install` in `ehr-launch/` fails with `E401` and `unauthenticated: User cannot be authenticated with the token provided` | The GitHub Packages token is missing, expired or not visible to this terminal. See [docs/github-packages-token.md](./docs/github-packages-token.md#check) and open a new terminal after setting it |
| `invalid_client` or unknown client | Register the client ID, auth method and redirect URI with the SMART server. They must match the app's settings |
| `SMART launch failed with error ...` | The launch `iss` probably differs from `FHIR_BASE_URL`. Set `FHIR_BASE_URL` to the EHR's FHIR base URL, exactly as the EHR sends it (for the launcher: `https://launch.smarthealthit.org/v/r4/fhir`) |
| `SMART callback failed with error ...` mentioning state | The launch is stale or was started in another tab or browser. Launch again from the EHR |
| Token exchange fails in the callback (`SMART callback failed`) | Confirm `CLIENT_AUTH_METHOD` matches the registered client type, check the secret or public JWK Set, and make sure the launch includes a patient and an encounter and `SCOPES` includes `offline_access` |
| `No active session` | Launch from the EHR in the same browser. Sessions live in server memory and expire after an hour |
| Missing ID token or patient | Include `openid fhirUser launch launch/patient` in `SCOPES` |
| Token endpoint 401 in `backend-services` | Check that `CLIENT_ID` matches the registration and that the registered JWK Set is the one `npm run generate-key` printed for the key in `PRIVATE_JWK_PATH` |
| FHIR 403 | Compare `SCOPES` with the granted `scope` in the token response (backend: `system/Patient.rs`) |
| `EADDRINUSE` or a second app on the same port | Another process uses the port. Stop it, or set a new `PORT` and `REDIRECT_URI` and update the launch and redirect URLs in the registration |
| `Basic authentication is required for confidential clients` or `invalid_client` with `client_secret_basic` | Check `CLIENT_ID` and `CLIENT_SECRET` against the registration, and that validation is **Strict** with the matching client type |
| `Unexpected authorization issuer` in `backend-services` | `AUTH_ISSUER` must equal the `issuer` in `<FHIR_BASE_URL>/.well-known/smart-configuration`, and its token endpoint must share that origin |
| `Use HTTPS URLs, or HTTP on localhost` | Only `localhost` may use HTTP. Anything else needs HTTPS. In Codespaces use the `https://<codespace-name>-3100.app.github.dev` URL |
| `running scripts is disabled on this system` | PowerShell blocks `npm.ps1`. Use `npm.cmd`, see [docs/install-node.md](./docs/install-node.md#powershell-blocks-npm) |
| `node`, `npm` or `fnm` is not recognized | Open a new terminal. If it persists, check that the install folder is on your `PATH` |
| `EBADENGINE` | The Node version differs from the folder's `.nvmrc`. Run `fnm use` there and check `node -v` |
| `SELF_SIGNED_CERT_IN_CHAIN` or `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | A corporate proxy re-signs TLS. Get the CA certificate from IT and set `NODE_EXTRA_CA_CERTS` to its file path. For `npm`, also check the proxy settings in your npm config. Never disable TLS verification |

`npm test` uses a local mock server. A running app talks to the SMART server you configured.

## Identifiers

FNR and DNR are string identifiers, not FHIR resource IDs. Backend Services searches by identifier:

```http
GET /Patient?identifier=urn:oid:2.16.578.1.12.4.1.4.1|<fnr>
```

| System | Identifier type |
|---|---|
| `urn:oid:2.16.578.1.12.4.1.4.1` | FNR |
| `urn:oid:2.16.578.1.12.4.1.4.2` | DNR |

Use synthetic values only. A third-party sandbox is not guaranteed to hold a patient with a given FNR.
