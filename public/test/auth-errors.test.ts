import assert from 'node:assert/strict'
import { test } from 'node:test'

import * as reference from '../src/reference.ts'

import { fixture, launchContext } from './fixture.ts'

test('Reference authentication: reject code replay, wrong PKCE and a changed redirect URI', async (t) => {
    const f = await fixture()
    t.after(f.close)

    const transaction = reference.newTransaction(
        { iss: f.config.fhirBase, launch: 'launch' },
        f.metadata,
        reference.pkce(),
    )

    f.registerCode('once', transaction.challenge)
    const tokens = await reference.exchange(f.config, transaction, 'once')
    assert.ok(f.issued.has(tokens.access_token))

    await assert.rejects(reference.exchange(f.config, transaction, 'once'))
    assert.equal(f.requests.filter((r) => r.path === '/oidc/token').at(-1)?.status, 400)

    f.registerCode('pkce', transaction.challenge)
    const wrongVerifier = { ...transaction, verifier: reference.pkce().verifier }
    await assert.rejects(reference.exchange(f.config, wrongVerifier, 'pkce'))

    f.registerCode('redirect', transaction.challenge)
    const changedRedirect = { ...f.config, redirectUri: 'http://localhost:3100/changed' }
    await assert.rejects(reference.exchange(changedRedirect, transaction, 'redirect'))

    assert.equal(f.tokenCalls(), 4, 'These attacks must exercise the token server, not merely throw locally')
})

test('Reference authentication: expired access tokens are not accepted', async (t) => {
    const f = await fixture()
    t.after(f.close)

    const tokens = await f.tokens()
    await reference.loadChart(f.config, tokens, launchContext)

    f.issued.get(tokens.access_token)!.expiresAt = 0

    await assert.rejects(reference.loadChart(f.config, tokens, launchContext))
    assert.ok(f.requests.some((r) => r.path.startsWith('/fhir/') && r.status === 401))
})

test('Reference authentication: state is required even when an authorization error is returned', async (t) => {
    const f = await fixture()
    t.after(f.close)

    const transaction = reference.newTransaction(
        { iss: f.config.fhirBase, launch: 'launch' },
        f.metadata,
        reference.pkce(),
    )
    const rejectedCallbacks = [
        { code: 'stolen' },
        { state: 'wrong', code: 'stolen' },
        { error: 'access_denied' },
        { state: transaction.state, error: 'access_denied' },
    ]

    assert.equal(reference.validateCallback({ state: transaction.state, code: 'valid' }, transaction), 'valid')

    for (const query of rejectedCallbacks) {
        assert.throws(() => reference.validateCallback(query, transaction))
    }
})
