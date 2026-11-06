import type { FastifyInstance } from 'fastify'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

import { splitScopes } from '../src/config.ts'

import type { Fixture } from './fixture.ts'
import { callbackPath, cookieValue, startBrowserLaunch } from './launch-helpers.ts'

// A full launch and callback against the fixture, returning the session cookie. The fixture grants
// `grantedScopes` (default: the registered SCOPES), whatever the app requested.
export async function signIn(app: FastifyInstance, f: Fixture, grantedScopes = f.config.scopes): Promise<string> {
    const { authorizeUrl, state, launchCookie } = await startBrowserLaunch(app, f)

    for (const scope of splitScopes(grantedScopes)) {
        if (!f.registeredScopes.includes(scope)) {
            f.registeredScopes.push(scope)
        }
    }

    const code = randomUUID()
    f.registerCode(code, authorizeUrl.searchParams.get('code_challenge')!, grantedScopes)

    const callback = await app.inject({
        url: callbackPath(state, code),
        cookies: { smart_launch: launchCookie },
    })

    assert.equal(callback.statusCode, 302, callback.body)

    return cookieValue(callback, 'smart_session')
}
