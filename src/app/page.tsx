// src/app/page.tsx
import {requireAuth} from "@/lib/auth";

export default async function DashboardPage() {
    const user = await requireAuth();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Welcome to your Org Dashboard</h1>
            <p>User: {user.email}</p>
            <p>Here you will see your org selector and ticket lists.</p>
        </div>
    );
}