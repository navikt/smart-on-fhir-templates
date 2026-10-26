import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createLocalJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import type { Config } from "../src/config.ts";
import { generateKey } from "../src/generate-key.ts";
import { clientAssertion } from "../src/reference.ts";

test("Scaffolding: generated key signs assertions that the printed public JWK Set verifies", async t => {
  const dir = await mkdtemp(join(tmpdir(), "sof-key-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, "keys", "private.jwk.json");
  const { publicJwkSet } = await generateKey(path);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  await assert.rejects(generateKey(path), { code: "EEXIST" });
  const config: Config = {
    variant: "private-key-jwt", port: 3100, fhirBase: "https://ehr.example/fhir", issuer: "https://ehr.example/oidc",
    clientId: "me-key", redirectUri: "http://localhost:3100/callback", scopes: "openid", privateJwkPath: path,
  };
  const jwt = await clientAssertion(config, "https://ehr.example/token");
  assert.equal(decodeProtectedHeader(jwt).kid, JSON.parse(await readFile(path, "utf8")).kid);
  const { payload } = await jwtVerify(jwt, createLocalJWKSet(publicJwkSet as never), {
    audience: "https://ehr.example/token", issuer: "me-key", algorithms: ["RS384"],
  });
  assert.equal(payload.sub, "me-key");
});
