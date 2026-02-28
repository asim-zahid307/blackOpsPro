// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

export async function createClient(): Promise<SupabaseClient> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!url || !key) {
        throw new Error(
            "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
    }

    const cookieStore = await cookies();

    return createServerClient(url, key, {
        cookies: {
            getAll: () =>
                cookieStore
                    .getAll()
                    .map((cookie) => ({ name: cookie.name, value: cookie.value })),
            setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                });
            },
        },
    });
}