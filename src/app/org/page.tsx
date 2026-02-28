import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export default async function OrgPage() {
    const supabase = await createClient();
    const {data: {user}, error} = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/login");
    }

    return (
        <div>
            <h1>Welcome, {user.email}</h1>
            <p>Your organizations will appear here.</p>
        </div>
    );
}