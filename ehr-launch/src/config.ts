import type { KnownFhirServer } from '@navikt/smart-on-fhir/client'
import { readFileSync } from 'node:fs'
import { z } from 'zod'

const DEFAULT_SCOPES = 'openid fhirUser launch launch/patient launch/encounter patient/Patient.rs offline_access'

export interface Config {
    port: number
    allowNonHttpsLaunch: boolean
    client: {
        clientId: string
        scope: string
        callbackUrl: string
        redirectUrl: string
        knownFhirServers: KnownFhirServer[]
    }
}

export class AppError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']

const PrivateJwkSchema = z.looseObject({ alg: z.string().min(1), kid: z.string().min(1) })

const EnvSchema = z.object({
    PORT: z.coerce.number().int().min(1024).max(65535).default(3100),
    FHIR_BASE_URL: z.url(),
    CLIENT_ID: z
        .string()
        .min(1)
        .refine(
            (value) => !value.startsWith('replace-'),
            'Set CLIENT_ID in .env to the client ID registered for your app',
        ),
    CLIENT_AUTH_METHOD: z.enum(['none', 'client_secret_basic', 'private_key_jwt']),
    CLIENT_SECRET: z.string().min(1).optional(),
    PRIVATE_JWK_PATH: z.string().min(1).default('keys/private.jwk.json'),
    REDIRECT_URI: z.url().default('http://localhost:3100/callback'),
    SCOPES: z.string().trim().min(1).default(DEFAULT_SCOPES),
})

function trustedUrl(value: string): URL {
    const url = new URL(value)

    const isLoopback = LOOPBACK_HOSTNAMES.includes(url.hostname)
    const isSecureTransport = url.protocol === 'https:' || (url.protocol === 'http:' && isLoopback)
    const hasForbiddenParts = Boolean(url.username || url.password || url.hash || url.search)

    if (!isSecureTransport || hasForbiddenParts) {
        throw new AppError(400, 'Use HTTPS URLs, or HTTP on localhost, without credentials/query/fragment.')
    }

    return url
}

export function configProblems(error: unknown): string[] | undefined {
    if (error instanceof z.ZodError) {
        return error.issues.map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
    }

    return error instanceof AppError ? [error.message] : undefined
}

function readPrivateKey(path: string): string {
    let contents: string
    let parsed: unknown

    try {
        contents = readFileSync(path, 'utf8')
    } catch {
        throw new AppError(400, `Cannot read PRIVATE_JWK_PATH ${path}. Run npm run generate-key to create it.`)
    }

    try {
        parsed = JSON.parse(contents)
    } catch {
        parsed = undefined
    }

    if (!PrivateJwkSchema.safeParse(parsed).success) {
        throw new AppError(400, `${path} must be a private JWK with alg and kid. Run npm run generate-key.`)
    }

    return contents
}

function knownFhirServer(values: z.infer<typeof EnvSchema>, issuer: string): KnownFhirServer {
    const server = { name: 'ehr', issuer }

    switch (values.CLIENT_AUTH_METHOD) {
        case 'none':
            return { ...server, type: 'public' }
        case 'client_secret_basic':
            if (!values.CLIENT_SECRET) {
                throw new AppError(400, 'Set CLIENT_SECRET in .env when CLIENT_AUTH_METHOD is client_secret_basic')
            }

            return {
                ...server,
                type: 'confidential-symmetric',
                method: 'client_secret_basic',
                clientSecret: values.CLIENT_SECRET,
            }
        case 'private_key_jwt':
            return {
                ...server,
                type: 'confidential-asymmetric',
                method: 'private_key_jwt',
                privateKey: readPrivateKey(values.PRIVATE_JWK_PATH),
            }
    }
}

export function readConfig(env = process.env): Config {
    const values = EnvSchema.parse(env)

    const redirect = trustedUrl(values.REDIRECT_URI)
    const fhirBase = trustedUrl(values.FHIR_BASE_URL)

    return {
        port: values.PORT,
        allowNonHttpsLaunch: fhirBase.protocol === 'http:',
        client: {
            clientId: values.CLIENT_ID,
            scope: values.SCOPES,
            callbackUrl: redirect.href,
            redirectUrl: new URL('/', redirect).href,
            knownFhirServers: [knownFhirServer(values, fhirBase.href.replace(/\/$/, ''))],
        },
    }
}
