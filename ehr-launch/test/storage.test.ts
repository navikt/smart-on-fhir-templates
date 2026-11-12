import type { SmartStorage } from '@navikt/smart-on-fhir/client'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createStorage } from '../src/storage.ts'

const HOUR_MS = 60 * 60 * 1000

function session(state: string): Parameters<SmartStorage['set']>[1] {
    return {
        fhirServer: 'https://fhir.example.org',
        tokenIssuer: 'https://fhir.example.org',
        jwksUri: 'https://fhir.example.org/jwks',
        introspectionEndpoint: 'https://fhir.example.org/introspect',
        authorizationEndpoint: 'https://fhir.example.org/authorize',
        tokenEndpoint: 'https://fhir.example.org/token',
        codeVerifier: 'verifier',
        state,
    }
}

test('entries expire after an hour', async () => {
    let now = 1_000
    const storage = createStorage(() => now)

    await storage.set('a', session('a'))

    now += HOUR_MS - 1
    assert.deepEqual(await storage.get('a'), session('a'))

    now += 1
    assert.equal(await storage.get('a'), undefined)
})

test('the oldest entry is evicted when the store is full', async () => {
    const storage = createStorage()

    for (let index = 0; index <= 1000; index++) {
        await storage.set(`key-${index}`, session(String(index)))
    }

    assert.equal(await storage.get('key-0'), undefined)
    assert.deepEqual(await storage.get('key-1'), session('1'))
    assert.deepEqual(await storage.get('key-1000'), session('1000'))
})
