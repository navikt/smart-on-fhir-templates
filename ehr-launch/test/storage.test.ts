import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createStorage } from '../src/storage.ts'

const HOUR_MS = 60 * 60 * 1000

test('entries expire after an hour', async () => {
    let now = 1_000
    const storage = createStorage(() => now)

    await storage.set('a', { value: 1 })

    now += HOUR_MS - 1
    assert.deepEqual(await storage.get('a'), { value: 1 })

    now += 1
    assert.equal(await storage.get('a'), undefined)
})

test('the oldest entry is evicted when the store is full', async () => {
    const storage = createStorage()

    for (let index = 0; index <= 1000; index++) {
        await storage.set(`key-${index}`, index)
    }

    assert.equal(await storage.get('key-0'), undefined)
    assert.equal(await storage.get('key-1'), 1)
    assert.equal(await storage.get('key-1000'), 1000)
})
