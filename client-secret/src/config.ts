import { z } from "zod";

export interface Config {
  port: number;
  fhirBase: string;
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string;
  secret: string;
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
    REDIRECT_URI: z.url().default("http://localhost:3100/callback"),
    SCOPES: z.string().trim().min(1),
    CLIENT_SECRET: z.string().min(1, "Set CLIENT_SECRET in .env to the secret registered for your app"),
  }).parse(env);
  trustedUrl(values.REDIRECT_URI);
  return {
    port: values.PORT,
    fhirBase: trustedUrl(values.FHIR_BASE_URL).href.replace(/\/$/, ""),
    issuer: trustedUrl(values.AUTH_ISSUER).href.replace(/\/$/, ""),
    clientId: values.CLIENT_ID,
    redirectUri: values.REDIRECT_URI,
    scopes: values.SCOPES,
    secret: values.CLIENT_SECRET,
  };
}
