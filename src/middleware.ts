import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// First line of defence for the owner portal; every admin page, action and route checks the session again.
export default NextAuth(authConfig).auth;

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
