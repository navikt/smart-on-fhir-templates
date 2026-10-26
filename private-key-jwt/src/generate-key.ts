import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { calculateJwkThumbprint, exportJWK, generateKeyPair } from "jose";

const alg = "RS384";

export async function generateKey(path: string): Promise<{ publicJwkSet: { keys: object[] } }> {
  const { privateKey, publicKey } = await generateKeyPair(alg, { extractable: true, modulusLength: 3072 });
  const publicJwk = await exportJWK(publicKey);
  const meta = { alg, use: "sig", kid: await calculateJwkThumbprint(publicJwk) };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ ...(await exportJWK(privateKey)), ...meta }, null, 2) + "\n",
    { flag: "wx", mode: 0o600 });
  await chmod(path, 0o600);
  return { publicJwkSet: { keys: [{ ...publicJwk, ...meta }] } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.env.PRIVATE_JWK_PATH || "keys/private.jwk.json";
  try {
    const { publicJwkSet } = await generateKey(path);
    console.error(`Private key written to ${path}. Give the host this public JWK Set:`);
    console.log(JSON.stringify(publicJwkSet, null, 2));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    console.error(`${path} already exists. Delete it first if you want a new key.`);
    process.exit(1);
  }
}
