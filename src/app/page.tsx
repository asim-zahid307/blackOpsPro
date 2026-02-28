import {requireAuth} from "@/lib/auth";

export default async function DashboardPage() {
    const user = await requireAuth();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
            <p>Go to <a href="/org" className="text-blue-600 underline">Your Organizations</a></p>
        </div>
    );
}