"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "@/app/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Manager name</Label>
        <Input
          id="displayName"
          name="displayName"
          placeholder="e.g. Alex the Gaffer"
          autoComplete="nickname"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-slate-400">At least 8 characters.</p>
      </div>
      <SubmitButton className="w-full" pendingText="Creating team…">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Already playing?{" "}
        <Link href="/login" className="font-semibold text-emerald-700">
          Log in
        </Link>
      </p>
    </form>
  );
}
