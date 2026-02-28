import {requireAuth} from "@/lib/auth";
import LogoutButton from "@/lib/components/LogoutButton";

export default async function DashboardPage() {
    const user = await requireAuth();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
                <LogoutButton />
            </div>
            <p>
                Go to{" "}
                <a href="/org" className="text-blue-600 underline">
                    Your Organizations
                </a>
            </p>
        </div>
    );
}