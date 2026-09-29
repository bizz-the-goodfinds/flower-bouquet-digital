import type { Metadata } from "next";
import { ResetPassword } from "@/components/garden/reset-password";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-4xl">Set a new password</h1>
      <ResetPassword />
    </div>
  );
}
