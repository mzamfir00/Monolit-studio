import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyOwnerCredentials } from "@/lib/server/owner-credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials, request) => verifyOwnerCredentials(credentials, request),
    }),
  ],
});
