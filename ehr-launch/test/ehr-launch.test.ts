import Fastify, { type FastifyInstance } from 'fastify'
import assert from 'node:assert/strict'
import { createHash, createPublicKey, createSign, createVerify, generateKeyPairSync, type KeyObject } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, type TestContext } from 'node:test'

import { buildApp } from '../src/app.ts'
import { AppError, readConfig } from '../src/config.ts'
import { generateKey } from '../src/generate-key.ts'

type AuthMethod = 'none' | 'client_secret_basic' | 'private_key_jwt'

const CLIENT_ID = 'smoke-client'
const CLIENT_SECRET = 'synthetic-client-secret'
const REDIRECT_URI = 'http://localhost:3100/callback'
const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'

interface TokenRequest {
    authorization: string | undefined
    body: URLSearchParams
}

interface Harness {
    app: FastifyInstance
    fhirBase: string
    tokenRequests: TokenRequest[]
    publicJwk: object | undefined
    finishLaunch: () => Promise<{ sessionCookie: string; callback: string; state: string }>
}

function base64url(value: string | Buffer): string {
    return Buffer.from(value).toString('base64url')
}

function signJwt(claims: object, privateKey: KeyObject): string {
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'mock' }))
    const payload = base64url(JSON.stringify(claims))
    const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey)

    return `${header}.${payload}.${base64url(signature)}`
}

async function setup(t: TestContext, method: AuthMethod): Promise<Harness> {
    const mock = Fastify()
    const signing = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const challenges = new Map<string, string>()
    const tokenRequests: TokenRequest[] = []

    const directory = await mkdtemp(join(tmpdir(), 'smart-ehr-launch-test-'))
    const privateJwkPath = join(directory, 'private.jwk.json')
    const publicJwk =
        method === 'private_key_jwt' ? (await generateKey(privateJwkPath)).publicJwkSet.keys[0] : undefined

    function origin(): string {
        return `http://127.0.0.1:${(mock.server.address() as { port: number }).port}`
    }

    mock.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_request, body, done) =>
        done(null, new URLSearchParams(String(body))),
    )

    mock.get('/fhir/.well-known/smart-configuration', async () => ({
        issuer: `${origin()}/oidc`,
        authorization_endpoint: `${origin()}/oidc/authorize`,
        token_endpoint: `${origin()}/oidc/token`,
        introspection_endpoint: `${origin()}/oidc/introspect`,
        jwks_uri: `${origin()}/oidc/jwks`,
        token_endpoint_auth_methods_supported: [method],
        code_challenge_methods_supported: ['S256'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        capabilities: ['launch-ehr', 'context-ehr-patient', 'context-ehr-encounter', 'permission-offline'],
    }))

    mock.get<{ Querystring: Record<string, string> }>('/oidc/authorize', async (request, reply) => {
        const code = `code-${challenges.size + 1}`
        challenges.set(code, request.query.code_challenge!)

        const callbackQuery = new URLSearchParams({ code, state: request.query.state! })

        return reply.redirect(`${request.query.redirect_uri}?${callbackQuery}`)
    })

    mock.post<{ Body: URLSearchParams }>('/oidc/token', async (request, reply) => {
        const body = request.body
        tokenRequests.push({ authorization: request.headers.authorization, body })

        const code = body.get('code') ?? ''
        const verifier = body.get('code_verifier') ?? ''
        const challenge = challenges.get(code)
        challenges.delete(code)

        if (challenge === undefined || createHash('sha256').update(verifier).digest('base64url') !== challenge) {
            return reply.code(400).send({ error: 'invalid_grant' })
        }

        const now = Math.floor(Date.now() / 1000)
        const issuer = `${origin()}/oidc`
        const common = { iat: now, exp: now + 300, iss: issuer, sub: 'h1' }

        return {
            access_token: signJwt({ ...common, aud: `${origin()}/fhir` }, signing.privateKey),
            token_type: 'Bearer',
            expires_in: 300,
            scope: body.get('scope') ?? 'openid',
            refresh_token: 'synthetic-refresh-token',
            patient: 'p1',
            encounter: 'e1',
            id_token: signJwt(
                { ...common, aud: CLIENT_ID, fhirUser: `${origin()}/fhir/Practitioner/h1` },
                signing.privateKey,
            ),
        }
    })

    mock.get('/oidc/jwks', async () => ({
        keys: [{ ...signing.publicKey.export({ format: 'jwk' }), kid: 'mock', alg: 'RS256', use: 'sig' }],
    }))

    mock.get('/fhir/Patient/p1', async (request, reply) => {
        if (!request.headers.authorization?.startsWith('Bearer ')) {
            return reply.code(401).send({})
        }

        return { resourceType: 'Patient', id: 'p1', name: [{ given: ['Smoke'], family: '<Patient>' }] }
    })

    await mock.listen({ port: 0, host: '127.0.0.1' })

    const fhirBase = `${origin()}/fhir`
    const config = readConfig({
        FHIR_BASE_URL: fhirBase,
        CLIENT_ID,
        CLIENT_AUTH_METHOD: method,
        CLIENT_SECRET: method === 'client_secret_basic' ? CLIENT_SECRET : undefined,
        PRIVATE_JWK_PATH: privateJwkPath,
        REDIRECT_URI,
    })
    const app = await buildApp(config)

    t.after(async () => {
        await app.close()
        await mock.close()
        await rm(directory, { recursive: true, force: true })
    })

    async function finishLaunch(): Promise<{ sessionCookie: string; callback: string; state: string }> {
        const started = await app.inject({ url: `/launch?${new URLSearchParams({ iss: fhirBase, launch: 'L1' })}` })

        assert.equal(started.statusCode, 302)

        const authorized = await fetch(new URL(started.headers.location as string), { redirect: 'manual' })
        const callbackUrl = new URL(authorized.headers.get('location')!)
        const sessionCookie = started.cookies.find((cookie) => cookie.name === 'smart_session')!.value

        return {
            sessionCookie,
            callback: `/callback${callbackUrl.search}`,
            state: callbackUrl.searchParams.get('state')!,
        }
    }

    return { app, fhirBase, tokenRequests, publicJwk, finishLaunch }
}

function assertClientAuthentication(method: AuthMethod, { tokenRequests, publicJwk }: Harness): void {
    assert.equal(tokenRequests.length, 1)

    const { authorization, body } = tokenRequests[0]!

    if (method === 'none') {
        assert.equal(authorization, undefined)
        assert.equal(body.get('client_assertion'), null)
    }

    if (method === 'client_secret_basic') {
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

        assert.equal(authorization, `Basic ${credentials}`)
    }

    if (method === 'private_key_jwt') {
        assert.equal(authorization, undefined)
        assert.equal(body.get('client_assertion_type'), CLIENT_ASSERTION_TYPE)

        const [header, payload, signature] = (body.get('client_assertion') ?? '').split('.')
        const verified = createVerify('RSA-SHA384')
            .update(`${header}.${payload}`)
            .verify(createPublicKey({ key: publicJwk as never, format: 'jwk' }), Buffer.from(signature!, 'base64url'))

        assert.ok(verified)
    }
}

for (const method of ['none', 'client_secret_basic', 'private_key_jwt'] as const) {
    test(`launch, callback and Patient page with ${method}`, async (t) => {
        const harness = await setup(t, method)
        const { app, finishLaunch } = harness
        const { sessionCookie, callback } = await finishLaunch()

        const finished = await app.inject({ url: callback, cookies: { smart_session: sessionCookie } })

        assert.equal(finished.statusCode, 302)
        assert.equal(finished.headers.location, 'http://localhost:3100/')
        assertClientAuthentication(method, harness)

        const home = await app.inject({ url: '/', cookies: { smart_session: sessionCookie } })

        assert.equal(home.statusCode, 200)
        assert.match(home.body, /Smoke &lt;Patient&gt;/)
    })
}

test('launch cookie is HttpOnly and Lax, and every launch gets a new session id', async (t) => {
    const { app, fhirBase } = await setup(t, 'none')
    const url = `/launch?${new URLSearchParams({ iss: fhirBase, launch: 'L1' })}`

    const first = await app.inject({ url })
    const second = await app.inject({ url, cookies: { smart_session: first.cookies[0]!.value } })

    assert.equal(first.cookies[0]!.httpOnly, true)
    assert.equal(first.cookies[0]!.sameSite, 'Lax')
    assert.notEqual(first.cookies[0]!.value, second.cookies[0]!.value)
})

test('rejects an unknown iss and a launch without parameters', async (t) => {
    const { app, tokenRequests } = await setup(t, 'none')

    const foreign = await app.inject({ url: '/launch?iss=https://untrusted.invalid/fhir&launch=L1' })
    const incomplete = await app.inject({ url: '/launch' })

    assert.equal(foreign.statusCode, 400)
    assert.equal(incomplete.statusCode, 400)
    assert.equal(tokenRequests.length, 0)
})

test('rejects a tampered state and shows an escaped EHR error', async (t) => {
    const { app, tokenRequests, finishLaunch } = await setup(t, 'client_secret_basic')
    const { sessionCookie, callback, state } = await finishLaunch()
    const cookies = { smart_session: sessionCookie }

    const tampered = await app.inject({ url: callback.replace(state, 'wrong'), cookies })
    const denied = await app.inject({
        url: '/callback?error=access_denied&error_description=%3Cb%3Eno%3C/b%3E',
        cookies,
    })
    const withoutSession = await app.inject({ url: '/' })

    assert.equal(tampered.statusCode, 400)
    assert.equal(tokenRequests.length, 0)
    assert.equal(denied.statusCode, 400)
    assert.match(denied.body, /access_denied: &lt;b&gt;no&lt;\/b&gt;/)
    assert.equal(withoutSession.statusCode, 401)
})

test('config requires a secret for client_secret_basic and trusted URLs', () => {
    const env = { FHIR_BASE_URL: 'https://ehr.invalid/fhir', CLIENT_ID, CLIENT_AUTH_METHOD: 'none' }

    assert.throws(() => readConfig({ ...env, CLIENT_AUTH_METHOD: 'client_secret_basic' }), AppError)
    assert.throws(() => readConfig({ ...env, FHIR_BASE_URL: 'http://ehr.invalid/fhir' }), AppError)
    assert.throws(() => readConfig({ ...env, CLIENT_AUTH_METHOD: 'basic' }))
    assert.throws(() => readConfig({ ...env, CLIENT_ID: 'replace-with-your-client-id' }))

    assert.equal(readConfig(env).allowNonHttpsLaunch, false)
    assert.equal(readConfig({ ...env, FHIR_BASE_URL: 'http://localhost:9000/fhir' }).allowNonHttpsLaunch, true)
})

test('config points to generate-key when the private key is missing', () => {
    const env = {
        FHIR_BASE_URL: 'https://ehr.invalid/fhir',
        CLIENT_ID,
        CLIENT_AUTH_METHOD: 'private_key_jwt',
        PRIVATE_JWK_PATH: join(tmpdir(), 'smart-ehr-launch-missing', 'private.jwk.json'),
    }

    assert.throws(
        () => readConfig(env),
        (error) => error instanceof AppError && /generate-key/.test(error.message),
    )
})
