import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Magic-link / OAuth landing: exchanges the PKCE code for a session cookie. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/garden";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/garden";
  if (code) {
    const { error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(`${safeNext}${safeNext.includes("?") ? "&" : "?"}signedin=1`, url.origin));
  }
  return NextResponse.redirect(new URL("/garden?auth=failed", url.origin));
}
