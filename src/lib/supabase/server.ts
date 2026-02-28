// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!url || !key) {
        throw new Error(
            "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
    }

    const cookieStore = await cookies();

    // Adapter to match Supabase expected type
    const cookieAdapter = {
        getAll: () => {
            return cookieStore.getAll().map((c) => ({
                name: c.name,
                value: c.value,
            }));
        },
        setAll: (cookiesToSet: any[]) => {
            try {
                cookiesToSet.forEach((c) => {
                    cookieStore.set(c.name, c.value, c.options);
                });
            } catch (error) {
                // Silently fail in cases where cookies cannot be set (e.g., middleware)
            }
        },
    };

    return createServerClient(url, key, { cookies: cookieAdapter });
}