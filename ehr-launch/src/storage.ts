import type { SmartStorage } from '@navikt/smart-on-fhir/client'

const ENTRY_TTL_MS = 60 * 60 * 1000
const MAX_ENTRIES = 1000

interface Entry {
    values: unknown
    expiresAt: number
}

export function createStorage(now: () => number = Date.now): SmartStorage {
    const entries = new Map<string, Entry>()

    return {
        async set(key, values) {
            entries.delete(key)

            if (entries.size >= MAX_ENTRIES) {
                entries.delete(entries.keys().next().value as string)
            }

            entries.set(key, { values, expiresAt: now() + ENTRY_TTL_MS })
        },
        async get(key) {
            const entry = entries.get(key)

            if (!entry || entry.expiresAt <= now()) {
                entries.delete(key)

                return undefined
            }

            return entry.values
        },
    }
}
