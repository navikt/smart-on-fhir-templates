import assert from 'node:assert/strict'
import { test } from 'node:test'

import { steps } from '../src/steps.ts'

import { fixture, launchContext } from './fixture.ts'

test('Solution authentication: reject code replay, wrong PKCE and a changed redirect URI', async (t) => {
    const f = await fixture()
    t.after(f.close)

    const transaction = steps.newTransaction({ iss: f.config.fhirBase, launch: 'launch' }, f.metadata, steps.pkce())

    f.registerCode('once', transaction.challenge)
    const tokens = await steps.exchange(f.config, transaction, 'once')
    assert.ok(f.issued.has(tokens.access_token))
    assert.equal(f.lastAuthorization(), undefined, 'A public client sends no client credentials')

    await assert.rejects(steps.exchange(f.config, transaction, 'once'))
    assert.equal(f.requests.filter((r) => r.path === '/oidc/token').at(-1)?.status, 400)

    f.registerCode('pkce', transaction.challenge)
    const wrongVerifier = { ...transaction, verifier: steps.pkce().verifier }
    await assert.rejects(steps.exchange(f.config, wrongVerifier, 'pkce'))

    f.registerCode('redirect', transaction.challenge)
    const changedRedirect = { ...f.config, redirectUri: 'http://localhost:3100/changed' }
    await assert.rejects(steps.exchange(changedRedirect, transaction, 'redirect'))

    assert.equal(f.tokenCalls(), 4, 'These attacks must exercise the token server, not merely throw locally')
})

test('Solution authentication: expired access tokens are not accepted', async (t) => {
    const f = await fixture()
    t.after(f.close)

    const tokens = await f.tokens()
    await steps.loadChart(f.config, tokens, launchContext)

    f.issued.get(tokens.access_token)!.expiresAt = 0

    await assert.rejects(steps.loadChart(f.config, tokens, launchContext))
    assert.ok(f.requests.some((r) => r.path.startsWith('/fhir/') && r.status === 401))
})

test('Solution authentication: state is required even when an authorization error is returned', async (t) => {
    const f = await fixture()
    t.after(f.close)

    const transaction = steps.newTransaction({ iss: f.config.fhirBase, launch: 'launch' }, f.metadata, steps.pkce())
    const rejectedCallbacks = [
        { code: 'stolen' },
        { state: 'wrong', code: 'stolen' },
        { error: 'access_denied' },
        { state: transaction.state, error: 'access_denied' },
    ]

    assert.equal(steps.validateCallback({ state: transaction.state, code: 'valid' }, transaction), 'valid')

    for (const query of rejectedCallbacks) {
        assert.throws(() => steps.validateCallback(query, transaction))
    }
})
