import { randomBytes } from "node:crypto";
import Fastify, { LogController } from "fastify";
import cookie from "@fastify/cookie";
import { AppError, type Config } from "./config.ts";
import { displayName, fhirGet, patientSchema } from "./fhir.ts";
import { escapeHtml, page } from "./http.ts";
import { completeLaunch, startLaunch, TRANSACTION_TTL_MS, type Session, type Transaction } from "./smart.ts";
import { configureServer } from "./server.ts";

export async function buildApp(config: Config) {
  const app = Fastify({ logger: true, logController: new LogController({ disableRequestLogging: true }) });
  configureServer(app);
  await app.register(cookie);
  const transactions = new Map<string, Transaction>();
  const sessions = new Map<string, Session>();
  const random = () => randomBytes(32).toString("base64url");
  const cookieOptions = {
    path: "/", httpOnly: true, sameSite: "lax" as const,
    secure: new URL(config.redirectUri).protocol === "https:",
  };
  app.addHook("onRequest", async () => {
    const now = Date.now();
    for (const [key, value] of transactions) if (now - value.createdAt > TRANSACTION_TTL_MS) transactions.delete(key);
    for (const [key, value] of sessions) if (value.expiresAt <= now) sessions.delete(key);
  });

  app.get("/launch", async (request, reply) => {
    if (transactions.size >= 1000) throw new AppError(503, "Too many pending launches; try again later.");
    const { transaction, url } = await startLaunch(config, request.query);
    const previous = request.cookies.smart_launch;
    if (previous) transactions.delete(previous);
    const transactionId = random();
    transactions.set(transactionId, transaction);
    reply.setCookie("smart_launch", transactionId, { ...cookieOptions, maxAge: TRANSACTION_TTL_MS / 1000 });
    return reply.redirect(url);
  });

  app.get("/callback", async (request, reply) => {
    const transactionId = request.cookies.smart_launch;
    const transaction = transactionId ? transactions.get(transactionId) : undefined;
    if (!transactionId || !transaction) throw new AppError(400, "No pending launch in this browser. Launch again.");
    transactions.delete(transactionId);
    reply.clearCookie("smart_launch", cookieOptions);
    const session = await completeLaunch(config, transaction, request.query);
    if (sessions.size >= 1000) throw new AppError(503, "Too many sessions; try again later.");
    const previous = request.cookies.smart_session;
    if (previous) sessions.delete(previous);
    const sessionId = random();
    sessions.set(sessionId, session);
    reply.setCookie("smart_session", sessionId, {
      ...cookieOptions, maxAge: Math.floor((session.expiresAt - Date.now()) / 1000),
    });
    return reply.redirect("/");
  });

  app.get("/", async (request, reply) => {
    const session = sessions.get(request.cookies.smart_session ?? "");
    if (!session) throw new AppError(401, "No session. Launch this app from the EPJ app picker.");
    const patient = await fhirGet(config, session.accessToken, `Patient/${session.patient}`, patientSchema);
    if (patient.id !== session.patient) throw new AppError(502, "Unexpected Patient resource.");
    return reply.type("text/html").send(page("Patient",
      `<p>${escapeHtml(displayName(patient))}</p><p>Signed in as ${escapeHtml(session.fhirUser)}</p>`));
  });
  return app;
}
