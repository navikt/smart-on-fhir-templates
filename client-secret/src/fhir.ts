import { z } from "zod";
import { AppError, type Config } from "./config.ts";
import { json } from "./http.ts";

export const id = z.string().regex(/^[A-Za-z0-9.-]{1,64}$/);

export const patientSchema = z.object({
  resourceType: z.literal("Patient"),
  id,
  name: z.array(z.object({
    text: z.string().optional(), given: z.array(z.string()).optional(), family: z.string().optional(),
  })).default([]),
});

export function fhirGet<T>(config: Config, token: string, path: string, schema: z.ZodType<T>): Promise<T> {
  return json(`${config.fhirBase}/${path}`, schema, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/fhir+json" },
  });
}

export function referenceId(config: Config, value: string, type: string): string {
  const url = new URL(value, `${config.fhirBase}/`);
  const prefix = `${new URL(config.fhirBase).pathname}/${type}/`;
  if (url.origin !== new URL(config.fhirBase).origin || !url.pathname.startsWith(prefix) || url.search || url.hash) {
    throw new AppError(400, `Expected a ${type} reference on the configured FHIR server.`);
  }
  return id.parse(url.pathname.slice(prefix.length));
}

export function displayName(patient: z.infer<typeof patientSchema>): string {
  const name = patient.name[0];
  return name?.text || [...(name?.given ?? []), name?.family].filter(Boolean).join(" ") || "Name unavailable";
}
