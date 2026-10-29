import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Guard for admin pages and server actions (the middleware is the first line, this is the second). */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

/** Guard for admin route handlers: null when the request is not signed in. */
export async function adminSession() {
  const session = await auth();
  return session?.user ? session : null;
}
