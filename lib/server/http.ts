import "server-only";

/** JSON response that must never be cached (the data changes with every swipe). */
export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Generic 500. Logs only the error name: never request data, never seed data. */
export function serverError(err: unknown): Response {
  const name = err instanceof Error ? err.name : "UnknownError";
  console.error(`[api] request failed (${name})`);
  return json({ error: "internal_error" }, 500);
}
