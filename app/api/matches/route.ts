import { json, serverError } from "@/lib/server/http";
import { getMatches } from "@/lib/server/swipe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json(await getMatches());
  } catch (err) {
    return serverError(err);
  }
}
