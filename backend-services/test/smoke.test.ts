import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import Fastify from "fastify";
import { createLocalJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { buildApp } from "../src/app.ts";
import type { Config } from "../src/config.ts";
import { generateKey } from "../src/generate-key.ts";

const clientId = "smoke-backend";
const identifier = "urn:oid:2.16.578.1.12.4.1.4.1|synthetic";

async function setup(t: TestContext, expiresIn = 300) {
  const mock = Fastify();
  const directory = await mkdtemp(join(tmpdir(), "smart-backend-test-"));
  const privateJwkPath = join(directory, "private.jwk.json");
  const { publicJwkSet } = await generateKey(privateJwkPath);
  const clientKeys = createLocalJWKSet(publicJwkSet as Parameters<typeof createLocalJWKSet>[0]);
  const tokens: { header: ReturnType<typeof decodeProtectedHeader>; scope: string | null }[] = [];
  const origin = () => `http://127.0.0.1:${(mock.server.address() as { port: number }).port}`;
  mock.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" },
    (_request, body, done) => done(null, new URLSearchParams(String(body))));
  mock.get("/fhir/.well-known/smart-configuration", async () => ({
    issuer: `${origin()}/oidc`, token_endpoint: `${origin()}/oidc/token`,
    token_endpoint_auth_methods_supported: ["private_key_jwt"], grant_types_supported: ["client_credentials"],
  }));
  mock.post<{ Body: URLSearchParams }>("/oidc/token", async (request, reply) => {
    const assertion = request.body.get("client_assertion") ?? "";
    await jwtVerify(assertion, clientKeys, {
      issuer: clientId, subject: clientId, audience: `${origin()}/oidc/token`,
      algorithms: ["RS384"], requiredClaims: ["exp", "iat", "jti"],
    });
    if (request.body.get("grant_type") !== "client_credentials") return reply.code(400).send({ error: "unsupported_grant_type" });
    tokens.push({ header: decodeProtectedHeader(assertion), scope: request.body.get("scope") });
    return { access_token: `synthetic-token-${tokens.length}`, token_type: "Bearer", expires_in: expiresIn, scope: "system/Patient.rs" };
  });
  mock.get<{ Querystring: Record<string, string> }>("/fhir/Patient", async (request, reply) => {
    if (!request.headers.authorization?.startsWith("Bearer synthetic-token-") || request.query.identifier !== identifier) {
      return reply.code(401).send({});
    }
    return {
      resourceType: "Bundle", type: "searchset",
      entry: [{ resource: { resourceType: "Patient", id: "p1", name: [{ given: ["Smoke"], family: "<Patient>" }] } }],
    };
  });
  await mock.listen({ port: 0, host: "127.0.0.1" });
  const config: Config = {
    port: 3100, fhirBase: `${origin()}/fhir`, issuer: `${origin()}/oidc`, clientId,
    scopes: "system/Patient.rs", privateJwkPath, patientIdentifier: identifier,
  };
  const app = await buildApp(config);
  t.after(async () => { await app.close(); await mock.close(); await rm(directory, { recursive: true, force: true }); });
  return { app, tokens };
}

test("signs an assertion, gets a system token and searches Patient", async t => {
  const { app, tokens } = await setup(t);
  const result = await app.inject({ url: "/" });
  assert.equal(result.statusCode, 200);
  assert.match(result.body, /Smoke &lt;Patient&gt;/);
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0]!.header.alg, "RS384");
  assert.equal(tokens[0]!.header.typ, "JWT");
  assert.ok(tokens[0]!.header.kid);
  assert.equal(tokens[0]!.scope, "system/Patient.rs");
});

test("reuses the token until it is near expiry", async t => {
  const { app, tokens } = await setup(t);
  await app.inject({ url: "/" });
  await app.inject({ url: "/" });
  assert.equal(tokens.length, 1);

  const expiring = await setup(t, 20);
  await expiring.app.inject({ url: "/" });
  await expiring.app.inject({ url: "/" });
  assert.equal(expiring.tokens.length, 2);
});
