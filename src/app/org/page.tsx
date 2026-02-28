import {requireAuth} from "@/lib/auth";

export default async function OrgPage() {
    const user = await requireAuth(); // reads server cookies

    return (
        <div>
            <h1>Welcome, {user.email}</h1>
            <p>Your organizations will appear here.</p>
        </div>
    );
}