import { z } from "zod";
import { AppError } from "./config.ts";

export async function request(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init, redirect: "error", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new AppError(502, `Upstream returned HTTP ${response.status}. Check scopes and registration.`);
  }
  return response;
}

export async function json<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  return schema.parse(await (await request(url, init)).json());
}

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function page(title: string, content: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body><main><h1>${escapeHtml(title)}</h1>${content}</main></body></html>`;
}
