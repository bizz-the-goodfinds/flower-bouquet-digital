import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Cookie-bound Supabase client for the signed-in user (anon key, respects RLS). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component; cookies are refreshed by the browser client instead.
        }
      },
    },
  });
}

/** The signed-in user's id, or null. Never throws. */
export async function currentUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  try {
    const { data } = await (await supabaseServer()).auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
