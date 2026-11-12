import { createHash, generateKeyPairSync } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const ALGORITHM = 'RS384'
const MODULUS_LENGTH = 3072
const PRIVATE_KEY_FILE_MODE = 0o600

export async function generateKey(path: string): Promise<{ publicJwkSet: { keys: object[] } }> {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: MODULUS_LENGTH })

    const publicJwk = publicKey.export({ format: 'jwk' })
    const thumbprintInput = JSON.stringify({ e: publicJwk.e, kty: publicJwk.kty, n: publicJwk.n })
    const metadata = {
        alg: ALGORITHM,
        use: 'sig',
        kid: createHash('sha256').update(thumbprintInput).digest('base64url'),
    }
    const privateJwk = { ...privateKey.export({ format: 'jwk' }), ...metadata }

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(privateJwk, null, 2) + '\n', { flag: 'wx', mode: PRIVATE_KEY_FILE_MODE })

    return { publicJwkSet: { keys: [{ ...publicJwk, ...metadata }] } }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const path = process.env.PRIVATE_JWK_PATH || 'keys/private.jwk.json'

    try {
        const { publicJwkSet } = await generateKey(path)

        console.error(`Private key written to ${path}. Register this public JWK Set with your SMART server:`)
        console.log(JSON.stringify(publicJwkSet, null, 2))
    } catch (error) {
        const keyAlreadyExists = (error as NodeJS.ErrnoException).code === 'EEXIST'

        if (!keyAlreadyExists) {
            throw error
        }

        console.error(`${path} already exists. Delete it first if you want a new key.`)
        process.exit(1)
    }
}
