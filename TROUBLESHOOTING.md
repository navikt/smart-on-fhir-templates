# Troubleshooting

| Symptom | Fix |
|---|---|
| `Configuration problem in .env` | Fix the listed variables, see the Configure step in your folder's README |
| `npm ci` or `npm start` says the Node version is not supported | Use the version in the folder's `.nvmrc`, see [docs/install-node.md](./docs/install-node.md) |
| `invalid_client` or unknown client | The SMART server has not registered your client ID, auth method and redirect URI. Match them exactly |
| `Launch iss ... does not match FHIR_BASE_URL` | Set `FHIR_BASE_URL` to the `iss` shown, exactly |
| Missing state or pending launch | Start a fresh launch from the EHR in the same browser |
| Missing ID token or patient | Include `openid fhirUser launch` in `SCOPES` |
| Token endpoint 401 | Check the secret, the `kid`, the key format and the assertion `aud` |
| FHIR 403 | Compare `SCOPES` with the granted `scope` in the token response (backend: `system/Patient.rs`) |
| Session expired | Launch again from the EHR; sessions live in server memory |
| Second app on another port | Set a new `PORT` and a `REDIRECT_URI` registered for it |
| `EADDRINUSE` | Another process uses the port. Stop it, or set a new `PORT` and update the launch and redirect URLs in the registration |
| `Basic authentication required` or `invalid_client` on the confidential apps | Check `CLIENT_ID` and `CLIENT_SECRET` against the registration, and that validation is `STRICT` with the matching client type |
| `Unexpected authorization issuer` | `AUTH_ISSUER` must equal the `issuer` in the server's discovery document (`/.well-known/openid-configuration`), and its token endpoint must share that origin |
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
