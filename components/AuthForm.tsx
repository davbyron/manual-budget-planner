"use client";

import type { AuthFormValues } from "@/types";
import type { AuthFormProps } from "@/types/props";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";

const titles = {
  "sign-in": "Sign in",
  "sign-up": "Create an account",
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
};

const inputClass = "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";
const linkClass = "underline underline-offset-4";
const invalidResetMessage = "This reset link is invalid or expired.";

export default function AuthForm(props: AuthFormProps) {
  const { mode } = props;
  const params = useSearchParams();
  const token = params.get("token");
  const id = useId();
  const [notice, setNotice] = useState("");
  const [resetLinkInvalid, setResetLinkInvalid] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    shouldUnregister: true,
  });
  const isSignIn = mode === "sign-in";
  const isSignUp = mode === "sign-up";
  const isReset = mode === "reset-password";
  const isForgot = mode === "forgot-password";
  const invalidReset = isReset && (!token || params.has("error") || resetLinkInvalid);
  const title = titles[mode];

  async function submit(values: AuthFormValues) {
    clearErrors("root");
    setNotice("");

    const email = values.email?.trim() ?? "";
    const password = values.password ?? "";

    try {
      if (isSignIn) {
        const result = await authClient.signIn.email({ email, password });
        if (result.error?.code === "EMAIL_NOT_VERIFIED") {
          setError("root", { message: "Verify your email before signing in. Check your inbox for a new verification link." });
        } else if (result.error) {
          setError("root", { message: result.error.status === 401 ? "Email or password is incorrect." : "Couldn't sign in. Try again." });
        } else {
          window.location.replace("/");
        }
      } else if (isSignUp) {
        const result = await authClient.signUp.email({
          name: values.name.trim(),
          email,
          password,
        });
        if (result.error) {
          setError("root", { message: "Couldn't create your account. Check your details and try again." });
        } else {
          setNotice("Check your inbox for a verification link. If you already have a verified account, sign in.");
        }
      } else if (isForgot) {
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        if (result.error) {
          setError("root", { message: "Couldn't request a password reset. Try again." });
        } else {
          setNotice("If an account exists for that address, you'll receive a password reset link.");
        }
      } else if (token) {
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error?.code === "INVALID_TOKEN") {
          setResetLinkInvalid(true);
        } else if (result.error) {
          setError("root", { message: "Couldn't reset your password. Try again." });
        } else {
          window.location.replace("/sign-in?reset=1");
        }
      }
    } catch {
      setError("root", { message: "Something went wrong. Try again." });
    }
  }

  return (
    <main className="m-auto px-4 py-10 w-full max-w-md sm:py-14">
      <section className="p-5 flex flex-col gap-5 rounded-xl border border-zinc-300 sm:p-7 dark:border-zinc-700">
        <h2>{title}</h2>
        {isSignIn && params.has("error") && (
          <p role="alert" className="text-sm text-red-500">
            The verification link used is invalid or expired. Sign in again to request a new one.
          </p>
        )}
        {isSignIn && !params.has("error") && params.get("verified") === "1" && (
          <p role="status" className="text-sm text-green-600">
            Your email was successfully verified. You can now sign in below.
          </p>
        )}
        {isSignIn && params.get("reset") === "1" && (
          <p role="status" className="text-sm text-green-600">
            Password successfully updated. You can now sign in below.
          </p>
        )}
        {invalidReset ? (
          <div className="flex flex-col gap-2 text-center">
            <p role="alert" className="text-sm text-red-500">{invalidResetMessage}</p>
            <Link 
              href="/forgot-password"
              className="
                mt-2 px-4 py-2 text-white text-sm font-semibold bg-neutral-950 rounded-lg
                dark:bg-zinc-100 dark:text-zinc-950
              "
            >
              Request a new reset link
            </Link>
          </div>
        ) : notice ? (
          <p role="status" className="text-sm">{notice}</p>
        ) : (
          <form
            onSubmit={handleSubmit(submit)}
            method="post"
            noValidate
          >
            <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
              {isSignUp && (
                <label className="grid gap-1 text-sm font-medium">
                  Name
                  <input
                    autoComplete="name"
                    className={inputClass}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? `${id}-name-error` : undefined}
                    {...register("name", {
                      validate: (value) => !!value.trim() || "Required",
                    })}
                  />
                  {errors.name && (
                    <span id={`${id}-name-error`} role="alert" className="text-red-500">
                      {errors.name.message}
                    </span>
                  )}
                </label>
              )}

              {!isReset && (
                <label className="grid gap-1 text-sm font-medium">
                  Email address
                  <input
                    type="email"
                    autoComplete={isSignIn ? "username" : "email"}
                    className={inputClass}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? `${id}-email-error` : undefined}
                    {...register("email", {
                      required: "Required",
                      setValueAs: (value: string) => value.trim(),
                      pattern: { value: /^[^\s@]+@[^\s@]+$/, message: "Invalid email address" },
                    })}
                  />
                  {errors.email && (
                    <span id={`${id}-email-error`} role="alert" className="text-red-500">
                      {errors.email.message}
                    </span>
                  )}
                </label>
              )}

              {!isForgot && (
                <label className="grid gap-1 text-sm font-medium">
                  {isReset ? "New password" : "Password"}
                  <input
                    type="password"
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    minLength={isSignIn ? undefined : 12}
                    maxLength={128}
                    className={inputClass}
                    aria-invalid={!!errors.password}
                    aria-describedby={[
                      isSignUp || isReset ? `${id}-password-requirements` : null,
                      errors.password ? `${id}-password-error` : null,
                    ].filter(Boolean).join(" ") || undefined}
                    {...register("password", {
                      required: "Required",
                      minLength: { value: isSignIn ? 1 : 12, message: "Password must be at least 12 characters long" },
                      maxLength: { value: 128, message: "Password must be no longer than 128 characters" },
                      validate: isSignIn ? undefined : {
                        uppercase: (value) => /[A-Z]/.test(value) || "Password must include at least one uppercase letter",
                        lowercase: (value) => /[a-z]/.test(value) || "Password must include at least one lowercase letter",
                        number: (value) => /[0-9]/.test(value) || "Password must include at least one number",
                        symbol: (value) => /[^a-zA-Z0-9\s]/.test(value) || "Password must include at least one symbol",
                      },
                      deps: isReset ? ["confirmPassword"] : [],
                    })}
                  />
                  <div className="flex items-center justify-between gap-2">
                    {errors.password && (
                      <span id={`${id}-password-error`} role="alert" className="text-red-500">
                        {errors.password.message}
                      </span>
                    )}
                    {isSignIn && (
                      <Link className={`${linkClass} ml-auto`} href="/forgot-password">Forgot password?</Link>
                    )}
                  </div>
                  {(isSignUp || isReset) && (
                    <div id={`${id}-password-requirements`} className="flex flex-col gap-1 font-normal">
                      <p>Password requirements:</p>
                      <ul className="pl-5 list-disc">
                        <li>12-128 characters</li>
                        <li>At least one uppercase letter (A-Z)</li>
                        <li>At least one lowercase letter (a-z)</li>
                        <li>At least one number (0-9)</li>
                        <li>At least one symbol (for example, !, @, or #)</li>
                      </ul>
                    </div>
                  )}
                </label>
              )}

              {(isReset || isSignUp) && (
                <label className="grid gap-1 text-sm font-medium">
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? `${id}-confirm-password-error` : undefined}
                    {...register("confirmPassword", {
                      required: "Required",
                      validate: (value, values) => value === values.password || "Passwords must match",
                    })}
                  />
                  {errors.confirmPassword && (
                    <span id={`${id}-confirm-password-error`} role="alert" className="text-red-500">
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </label>
              )}

              <button
                type="submit"
                className="
                  mt-2 px-4 py-2 text-white text-sm font-semibold bg-neutral-950 rounded-lg
                  dark:bg-zinc-100 dark:text-zinc-950
                "
              >
                {isSubmitting ? "Please wait…" : isForgot ? "Send reset link" : title}
              </button>
            </fieldset>
            {errors.root && (
              <p role="alert" className="mt-3 text-sm text-red-500 dark:text-red-300">
                {errors.root.message}
              </p>
            )}
          </form>
        )}

        <hr className={`${(isSignIn) && "mt-6"} border-zinc-300`} />

        {isSignIn ? (
          <div className="relative w-full flex flex-col items-center gap-5">
            <p className="absolute bottom-20 w-fit p-2 text-sm text-center bg-white z-10">
              or
            </p>
            <Link
              href="/sign-up"
              className="
                my-4 px-4 py-3 w-full text-sm text-white text-center font-semibold bg-neutral-950 rounded-lg
                dark:bg-zinc-100 dark:text-zinc-950
              "
            >
              Create an account
            </Link>
          </div>
        ) : (
          <Link href="/sign-in" className={`${linkClass} text-sm text-center`}>
            Back to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
