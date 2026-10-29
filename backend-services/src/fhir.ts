import { z } from "zod";
import { AppError, type Config } from "./config.ts";
import { json } from "./http.ts";

const patientSchema = z.object({
  resourceType: z.literal("Patient"),
  id: z.string().regex(/^[A-Za-z0-9.-]{1,64}$/),
  name: z.array(z.object({
    text: z.string().optional(), given: z.array(z.string()).optional(), family: z.string().optional(),
  })).default([]),
});
const bundleSchema = z.object({
  resourceType: z.literal("Bundle"), type: z.literal("searchset"),
  entry: z.array(z.object({ resource: patientSchema })).default([]),
  link: z.array(z.object({ relation: z.string() })).optional(),
});

export async function searchPatients(config: Config, token: string) {
  const query = new URLSearchParams({ identifier: config.patientIdentifier });
  const bundle = await json(`${config.fhirBase}/Patient?${query}`, bundleSchema, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/fhir+json" },
  });
  if (bundle.link?.some(link => link.relation === "next")) {
    throw new AppError(502, "Result is paginated; this template does not follow next links.");
  }
  return bundle.entry.map(entry => entry.resource);
}

export function displayName(patient: z.infer<typeof patientSchema>): string {
  const name = patient.name[0];
  return name?.text || [...(name?.given ?? []), name?.family].filter(Boolean).join(" ") || "Name unavailable";
}
