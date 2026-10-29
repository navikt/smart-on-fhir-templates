import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { importJWK, SignJWT } from "jose";
import { z } from "zod";
import { AppError, trustedUrl, type Config } from "./config.ts";
import { json } from "./http.ts";

const REFRESH_MARGIN_MS = 30_000;

const discoverySchema = z.object({
  issuer: z.url(), token_endpoint: z.url(),
  token_endpoint_auth_methods_supported: z.array(z.string()),
  grant_types_supported: z.array(z.string()),
});
const tokenSchema = z.object({
  access_token: z.string().min(1), token_type: z.literal("Bearer"),
  expires_in: z.number().int().positive(), scope: z.string().min(1),
  patient: z.never().optional(), encounter: z.never().optional(),
  id_token: z.never().optional(), refresh_token: z.never().optional(),
});
const privateJwkSchema = z.looseObject({
  kid: z.string().min(1), use: z.literal("sig"), alg: z.enum(["RS384", "ES384"]),
});

async function discoverTokenEndpoint(config: Config): Promise<string> {
  const metadata = await json(`${config.fhirBase}/.well-known/smart-configuration`, discoverySchema);
  if (metadata.issuer !== config.issuer ||
      trustedUrl(metadata.token_endpoint).origin !== new URL(config.issuer).origin) {
    throw new AppError(400, "Unexpected authorization issuer or token endpoint.");
  }
  if (!metadata.token_endpoint_auth_methods_supported.includes("private_key_jwt") ||
      !metadata.grant_types_supported.includes("client_credentials")) {
    throw new AppError(400, "Server does not advertise private_key_jwt with client_credentials.");
  }
  return metadata.token_endpoint;
}

async function clientAssertion(config: Config, tokenEndpoint: string): Promise<string> {
  const jwk = privateJwkSchema.parse(JSON.parse(await readFile(config.privateJwkPath, "utf8")));
  return new SignJWT({})
    .setProtectedHeader({ alg: jwk.alg, typ: "JWT", kid: jwk.kid })
    .setIssuer(config.clientId).setSubject(config.clientId).setAudience(tokenEndpoint)
    .setIssuedAt().setExpirationTime("2m").setJti(randomUUID())
    .sign(await importJWK(jwk, jwk.alg));
}

async function requestToken(config: Config) {
  const tokenEndpoint = await discoverTokenEndpoint(config);
  const tokens = await json(tokenEndpoint, tokenSchema, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials", scope: config.scopes, client_id: config.clientId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: await clientAssertion(config, tokenEndpoint),
    }),
  });
  const requested = config.scopes.split(/\s+/);
  if (tokens.scope.split(/\s+/).some(scope => !requested.includes(scope))) {
    throw new AppError(502, "Token response contains scopes that were not requested.");
  }
  return tokens;
}

export function tokenProvider(config: Config): () => Promise<string> {
  let cached: { accessToken: string; expiresAt: number } | undefined;
  return async () => {
    if (cached && Date.now() < cached.expiresAt - REFRESH_MARGIN_MS) return cached.accessToken;
    const tokens = await requestToken(config);
    cached = { accessToken: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 };
    return cached.accessToken;
  };
}
