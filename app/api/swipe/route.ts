import { json, serverError } from "@/lib/server/http";
import { parseSwipeBody, swipe } from "@/lib/server/swipe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const input = parseSwipeBody(body);
  if (!input) return json({ error: "invalid_body" }, 400);

  try {
    const result = await swipe(input.profileId, input.direction);
    if (result.status === "not_found") return json({ error: "profile_not_found" }, 404);
    return json(result.body);
  } catch (err) {
    return serverError(err);
  }
}
