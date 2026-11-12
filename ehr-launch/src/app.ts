import cookie from '@fastify/cookie'
import { SmartClient, type SmartStorage } from '@navikt/smart-on-fhir/client'
import Fastify, { LogController, type FastifyInstance } from 'fastify'
import { z } from 'zod'

import { AppError, type Config } from './config.ts'
import { displayName } from './fhir.ts'
import { escapeHtml, page, randomToken } from './http.ts'
import { configureServer } from './server.ts'
import { createStorage } from './storage.ts'

const SESSION_COOKIE = 'smart_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60

const LaunchQuerySchema = z.object({ iss: z.string().min(1), launch: z.string().min(1) })

const CallbackQuerySchema = z.object({
    code: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
})

function libraryError(step: string, error: unknown): AppError {
    return new AppError(
        400,
        `SMART ${step} failed with error ${String(error)}. See Troubleshooting in the root README.md.`,
    )
}

export async function buildApp(config: Config, storage: SmartStorage = createStorage()): Promise<FastifyInstance> {
    const app = Fastify({ logger: true, logController: new LogController({ disableRequestLogging: true }) })
    configureServer(app)
    await app.register(cookie)

    const cookieOptions = {
        path: '/',
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: new URL(config.client.callbackUrl).protocol === 'https:',
    }

    function createClient(sessionId: string): SmartClient {
        return new SmartClient(sessionId, config.client, {
            storage,
            options: { allowNonHttpsLaunch: config.allowNonHttpsLaunch },
        })
    }

    app.get('/launch', async (request, reply) => {
        const query = LaunchQuerySchema.safeParse(request.query)

        if (!query.success) {
            throw new AppError(400, 'Launch this app from your EHR. The launch needs iss and launch parameters.')
        }

        const sessionId = randomToken()
        const result = await createClient(sessionId).launch(query.data)

        if ('error' in result) {
            throw libraryError('launch', result.error)
        }

        reply.setCookie(SESSION_COOKIE, sessionId, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS })

        return reply.redirect(result.redirectUrl)
    })

    app.get('/callback', async (request, reply) => {
        const query = CallbackQuerySchema.safeParse(request.query)

        if (!query.success) {
            throw new AppError(400, 'Invalid callback parameters. Launch again from your EHR.')
        }

        const { code, state, error, error_description: errorDescription } = query.data

        if (error) {
            const description = errorDescription ? `: ${errorDescription}` : ''

            throw new AppError(400, `The EHR returned an error: ${error}${description}`)
        }

        const sessionId = request.cookies[SESSION_COOKIE]

        if (!sessionId || !code || !state) {
            throw new AppError(400, 'No pending launch in this browser. Launch again from your EHR.')
        }

        const result = await createClient(sessionId).callback({ code, state })

        if ('error' in result) {
            throw libraryError('callback', result.error)
        }

        return reply.redirect(result.redirectUrl)
    })

    app.get('/', async (request, reply) => {
        const sessionId = request.cookies[SESSION_COOKIE]
        const ready = sessionId ? await createClient(sessionId).ready() : undefined

        if (!ready || 'error' in ready) {
            throw new AppError(401, 'No active session. Launch this app from your EHR.')
        }

        const patient = await ready.patient.request()

        if ('error' in patient) {
            throw libraryError('patient request', patient.error)
        }

        const content = `<p>${escapeHtml(displayName(patient))}</p>`

        return reply.type('text/html').send(page('Patient', content))
    })

    return app
}
