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
| Session expired | Launch again from the EHR, sessions live in server memory |
| Second app on another port | Set a new `PORT` and a `REDIRECT_URI` registered for it |
| Browser cannot reach `backend-services` in Codespaces | Set `HOST=0.0.0.0` in `.env`, see [docs/install-node.md](./docs/install-node.md#codespaces) |

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
