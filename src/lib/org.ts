import {createClient} from "./supabase/server";
import {Org} from "@/types/domain";
import type { PostgrestError } from '@supabase/postgrest-js';

export async function getUserOrgs(userId: string): Promise<Org[]> {
    const supabase = await createClient();

    // Call .from() without incorrect generics and assert the result type to Org[]
    const {data, error} = (await supabase
        .from("organizations")
        .select("*")
        .eq("user_id", userId)) as { data: Org[] | null; error: PostgrestError | null };

    if (error) {
        console.error("Error fetching orgs:", error);
        return [];
    }

    return data ?? [];
}