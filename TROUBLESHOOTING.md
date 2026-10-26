# Troubleshooting

| Symptom | Fix |
|---|---|
| `TODO n` / HTTP 501 | Implement that step in `src/steps.ts`, or compare with `src/reference.ts` |
| `Configuration problem in .env` | Fix the listed variables, see "Before you start" in [README.md](./README.md) |
| `invalid_client` or unknown client | The host may not have registered it yet. Ask the host to confirm the registration |
| `Launch token was issued for another organisation.` | You switched organisation in another tab, or someone else uses your login. Log in with your own clinician and relaunch |
| `Launch iss ... does not match FHIR_BASE_URL` | Set `FHIR_BASE_URL` to the `iss` shown, exactly |
| Unknown client or rejected redirect | Match client ID, auth method and URIs to your registration |
| Missing state or pending launch | Start a fresh launch from the app picker in the same browser |
| Missing ID token or patient | Include `openid fhirUser launch` in `SCOPES` |
| App picker disabled | Start a consultation for the patient |
| Token endpoint 401 | Check the secret, the `kid`, the key format and the assertion `aud` |
| FHIR 403 | Compare `SCOPES` with the granted `scope` in the token response (backend: `system/Patient.rs`) |
| Session expired | Launch again, sessions live in memory |
| Second app on another port | Set a new `PORT` and a `REDIRECT_URI` registered for it |

Real vs mocked: your running app talks to the real nav-epj, `npm test` uses a local mock.

## Patients

Four patients have an ongoing consultation ("Pågår nå"):

| Patient | Organisation |
|---|---|
| BJARNE BERGE | Skogtun Legekontor |
| ELSE STRAND | Havnegata Legesenter |
| TOMAS NOVAK | Bjerkely Legepraksis |
| HELGE BRATT | Solbakken Familielegekontor |

A launch shows only your session organisation's patients. Start a consultation for any other patient.

Backend Services searches by identifier:

```http
GET /Patient?identifier=urn:oid:2.16.578.1.12.4.1.4.1|20856210112
```

| System | Identifier type |
|---|---|
| `urn:oid:2.16.578.1.12.4.1.4.1` | FNR |
| `urn:oid:2.16.578.1.12.4.1.4.2` | DNR |

Full roster: https://github.com/navikt/nav-epj/blob/main/docs/hackathon-roster.md
