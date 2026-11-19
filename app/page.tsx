import { redirect } from "next/navigation";

/** Demo-friendly: the root URL goes straight to the Discover tab. */
export default function RootPage() {
  redirect("/discover");
}
