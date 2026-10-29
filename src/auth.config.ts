import type { NextAuthConfig } from "next-auth";

/** Edge-safe part of the Auth.js config, shared by the middleware and src/auth.ts. */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  // Behind a reverse proxy the Host header decides the callback URL; set AUTH_URL to pin it.
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/admin/login") return true;
      if (auth?.user) return true;
      if (pathname.startsWith("/api/")) return Response.json({ error: "Neautorizat." }, { status: 401 });
      return false;
    },
  },
} satisfies NextAuthConfig;
