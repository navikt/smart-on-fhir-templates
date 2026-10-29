import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRemoteJWKSet, importJWK, jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { AppError, trustedUrl, type Config } from "./config.ts";
import { id, referenceId } from "./fhir.ts";
import { json } from "./http.ts";

export const TRANSACTION_TTL_MS = 300_000;
const MAX_SESSION_SECONDS = 1800;

const discoverySchema = z.object({
  issuer: z.url(), authorization_endpoint: z.url(), token_endpoint: z.url(), jwks_uri: z.url(),
  token_endpoint_auth_methods_supported: z.array(z.string()),
  code_challenge_methods_supported: z.array(z.string()),
  grant_types_supported: z.array(z.string()),
});
const tokenSchema = z.object({
  access_token: z.string().min(1), token_type: z.literal("Bearer"),
  expires_in: z.number().int().positive(), scope: z.string(),
  id_token: z.string().min(1), patient: id, encounter: id.optional(),
});
const privateJwkSchema = z.looseObject({
  kid: z.string().min(1), use: z.literal("sig"), alg: z.enum(["RS384", "ES384"]),
});

export interface Transaction {
  iss: string; discovery: z.infer<typeof discoverySchema>;
  state: string; verifier: string; createdAt: number;
}
export interface Session {
  accessToken: string; patient: string; encounter?: string;
  fhirUser: string; scope: string; expiresAt: number;
}

const jwksByUri = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

async function discover(config: Config) {
  const metadata = await json(`${config.fhirBase}/.well-known/smart-configuration`, discoverySchema);
  if (metadata.issuer !== config.issuer) throw new AppError(400, "Unexpected authorization issuer.");
  for (const endpoint of [metadata.authorization_endpoint, metadata.token_endpoint, metadata.jwks_uri]) {
    if (trustedUrl(endpoint).origin !== new URL(config.issuer).origin) {
      throw new AppError(400, "Discovery endpoint is outside the trusted authorization origin.");
    }
  }
  if (!metadata.token_endpoint_auth_methods_supported.includes("private_key_jwt") ||
      !metadata.grant_types_supported.includes("authorization_code") ||
      !metadata.code_challenge_methods_supported.includes("S256")) {
    throw new AppError(400, "Server does not advertise private_key_jwt, authorization_code or S256.");
  }
  return metadata;
}

export async function startLaunch(config: Config, query: unknown): Promise<{ transaction: Transaction; url: string }> {
  const launch = z.object({ iss: z.string().max(2048), launch: z.string().min(1).max(2048) }).safeParse(query);
  if (!launch.success) throw new AppError(400, "Launch requires iss and a launch ID.");
  if (launch.data.iss !== config.fhirBase) {
    throw new AppError(400, `Launch iss "${launch.data.iss}" does not match FHIR_BASE_URL "${config.fhirBase}".`);
  }
  const discovery = await discover(config);
  const verifier = randomBytes(32).toString("base64url");
  const transaction: Transaction = {
    iss: launch.data.iss, discovery, verifier,
    state: randomBytes(32).toString("base64url"), createdAt: Date.now(),
  };
  const url = new URL(discovery.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code", client_id: config.clientId, redirect_uri: config.redirectUri,
    scope: config.scopes, aud: transaction.iss, launch: launch.data.launch, state: transaction.state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256",
  }).toString();
  return { transaction, url: url.href };
}

function callbackCode(query: unknown, transaction: Transaction): string {
  const result = z.object({
    state: z.string().min(1), code: z.string().min(1).optional(), error: z.string().optional(),
  }).safeParse(query);
  const actual = Buffer.from(result.success ? result.data.state : "");
  const expected = Buffer.from(transaction.state);
  if (!result.success || actual.length !== expected.length || !timingSafeEqual(actual, expected) ||
      Date.now() - transaction.createdAt > TRANSACTION_TTL_MS) {
    throw new AppError(400, "Missing, expired or mismatched OAuth state. Launch again from the EPJ.");
  }
  if (result.data.error || !result.data.code) {
    throw new AppError(400, "Authorization was declined or no code was returned. Launch again.");
  }
  return result.data.code;
}

async function clientAssertion(config: Config, tokenEndpoint: string): Promise<string> {
  const jwk = privateJwkSchema.parse(JSON.parse(await readFile(config.privateJwkPath, "utf8")));
  return new SignJWT({})
    .setProtectedHeader({ alg: jwk.alg, typ: "JWT", kid: jwk.kid })
    .setIssuer(config.clientId).setSubject(config.clientId).setAudience(tokenEndpoint)
    .setIssuedAt().setExpirationTime("2m").setJti(randomUUID())
    .sign(await importJWK(jwk, jwk.alg));
}

async function exchange(config: Config, transaction: Transaction, code: string) {
  const tokenEndpoint = transaction.discovery.token_endpoint;
  return json(tokenEndpoint, tokenSchema, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code", code, code_verifier: transaction.verifier,
      redirect_uri: config.redirectUri, client_id: config.clientId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: await clientAssertion(config, tokenEndpoint),
    }),
  });
}

async function verifiedFhirUser(config: Config, jwksUri: string, idToken: string): Promise<string> {
  let jwks = jwksByUri.get(jwksUri);
  if (!jwks) jwksByUri.set(jwksUri, jwks = createRemoteJWKSet(new URL(jwksUri)));
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: config.issuer, audience: config.clientId, algorithms: ["RS256", "ES256"],
    requiredClaims: ["iss", "aud", "sub", "iat", "exp"], clockTolerance: 5,
  });
  if ((Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== config.clientId) ||
      (payload.azp !== undefined && payload.azp !== config.clientId)) {
    throw new AppError(400, "ID token has an unexpected authorized party.");
  }
  return `Practitioner/${referenceId(config, z.string().parse(payload.fhirUser), "Practitioner")}`;
}

export async function completeLaunch(config: Config, transaction: Transaction, query: unknown): Promise<Session> {
  const tokens = await exchange(config, transaction, callbackCode(query, transaction));
  return {
    accessToken: tokens.access_token, patient: tokens.patient, encounter: tokens.encounter,
    fhirUser: await verifiedFhirUser(config, transaction.discovery.jwks_uri, tokens.id_token),
    scope: tokens.scope,
    expiresAt: Date.now() + Math.min(tokens.expires_in, MAX_SESSION_SECONDS) * 1000,
  };
}
