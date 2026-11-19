import { resetState } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Demo helper. Allowed outside production, or when ALLOW_RESET=true. */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_RESET !== "true") {
    return json({ error: "reset_disabled" }, 403);
  }
  try {
    await resetState();
    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
