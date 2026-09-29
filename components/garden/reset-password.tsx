"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { MiniBloom } from "@/components/ui/bloom-loader";

/** Lands here from the reset email (the callback already exchanged the code for a session). */
export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "done")
    return (
      <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <p className="font-medium">Password updated ✨</p>
        <Link href="/garden" className="btn-primary mt-4">
          Go to My bouquets
        </Link>
      </div>
    );

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        const { error: err } = await supabaseBrowser().auth.updateUser({ password });
        if (err) {
          setError(/session|auth/i.test(err.message) ? "This reset link has expired. Request a new one from My bouquets." : err.message);
          setState("error");
        } else setState("done");
      }}
    >
      <label className="block">
        <span className="label">New password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field mt-1.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8+ characters"
        />
      </label>
      <button className="btn-primary w-full" disabled={state === "saving"}>
        {state === "saving" ? (
          <>
            <MiniBloom /> Saving…
          </>
        ) : (
          "Save password"
        )}
      </button>
      {error && (
        <p role="alert" className="text-sm text-petal-deep">
          {error}
        </p>
      )}
    </form>
  );
}
