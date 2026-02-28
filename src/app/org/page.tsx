// src/app/org/page.tsx
import {requireAuth} from "@/lib/auth";

export default async function OrgPage() {
    const user = await requireAuth();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Your Organizations</h1>
            <p>User: {user.email}</p>
            <p>Here you will see the list of your orgs and tickets.</p>
        </div>
    );
}