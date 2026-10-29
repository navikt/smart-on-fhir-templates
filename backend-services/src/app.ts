import Fastify, { LogController } from "fastify";
import type { Config } from "./config.ts";
import { displayName, searchPatients } from "./fhir.ts";
import { escapeHtml, page } from "./http.ts";
import { configureServer } from "./server.ts";
import { tokenProvider } from "./smart.ts";

export async function buildApp(config: Config) {
  const app = Fastify({ logger: true, logController: new LogController({ disableRequestLogging: true }) });
  configureServer(app);
  const accessToken = tokenProvider(config);

  app.get("/", async (_request, reply) => {
    const patients = await searchPatients(config, await accessToken());
    const names = patients.map(patient => `<li>${escapeHtml(displayName(patient))}</li>`).join("");
    return reply.type("text/html").send(page("Patient search",
      patients.length ? `<ul>${names}</ul>` : "<p>No patient matched the configured identifier.</p>"));
  });
  return app;
}
