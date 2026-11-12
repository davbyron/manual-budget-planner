import "server-only";
import { createElement } from "react";
import { ResetPasswordEmailTemplate, VerificationEmailTemplate } from "@/components/email-templates";
import { sendAuthEmail } from "./auth-email";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      sendAuthEmail(user.email, "Reset your password", createElement(ResetPasswordEmailTemplate, { url }));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set("callbackURL", "/sign-in?verified=1");
      sendAuthEmail(user.email, "Verify your email address", createElement(VerificationEmailTemplate, {
        url: verificationUrl.toString(),
      }));
    },
  },
  plugins: [
    nextCookies()
  ],
  user: {
    modelName: "User",
  },
  session: {
    modelName: "Session",
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  }
});
