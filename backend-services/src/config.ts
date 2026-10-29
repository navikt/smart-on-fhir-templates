import { z } from "zod";

export interface Config {
  port: number;
  fhirBase: string;
  issuer: string;
  clientId: string;
  scopes: string;
  privateJwkPath: string;
  patientIdentifier: string;
}

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function trustedUrl(value: string): URL {
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
      url.username || url.password || url.hash || url.search) {
    throw new AppError(400, "Use HTTPS URLs, or HTTP on localhost, without credentials/query/fragment.");
  }
  return url;
}

export function configProblems(error: unknown): string[] | undefined {
  if (error instanceof z.ZodError) {
    return error.issues.map(i => `${i.path.join(".") || "config"}: ${i.message}`);
  }
  return error instanceof AppError ? [error.message] : undefined;
}

export function readConfig(env = process.env): Config {
  const values = z.object({
    PORT: z.coerce.number().int().min(1024).max(65535).default(3100),
    FHIR_BASE_URL: z.url(),
    AUTH_ISSUER: z.url(),
    CLIENT_ID: z.string().min(1).refine(v => !v.startsWith("replace-"), "Set CLIENT_ID in .env to the client ID registered for your app"),
    SCOPES: z.string().trim().min(1).refine(
      v => v.split(/\s+/).every(s => s.startsWith("system/")), "Backend Services only uses system/ scopes"),
    PRIVATE_JWK_PATH: z.string().min(1, "Set PRIVATE_JWK_PATH in .env (run npm run generate-key to create the key)"),
    PATIENT_IDENTIFIER: z.string().min(1, "Set PATIENT_IDENTIFIER in .env, e.g. system|value"),
  }).parse(env);
  return {
    port: values.PORT,
    fhirBase: trustedUrl(values.FHIR_BASE_URL).href.replace(/\/$/, ""),
    issuer: trustedUrl(values.AUTH_ISSUER).href.replace(/\/$/, ""),
    clientId: values.CLIENT_ID,
    scopes: values.SCOPES,
    privateJwkPath: values.PRIVATE_JWK_PATH,
    patientIdentifier: values.PATIENT_IDENTIFIER,
  };
}
