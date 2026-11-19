import { getFeed, parseLimit } from "@/lib/server/feed";
import { json, serverError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
    return json(await getFeed(limit));
  } catch (err) {
    return serverError(err);
  }
}
