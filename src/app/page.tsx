import {requireAuth} from "@/lib/auth";
import LogoutButton from "@/lib/components/LogoutButton";

export default async function DashboardPage() {
    const user = await requireAuth();

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
            <div
                className="w-full max-w-3xl p-8 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Welcome, <span className="text-blue-600">{user.email}</span>
                    </h1>
                    <LogoutButton/>
                </div>

                <p className="text-slate-600">
                    Go to{" "}
                    <a
                        href="/org"
                        className="font-medium text-blue-600 hover:text-blue-700 transition underline underline-offset-4"
                    >
                        Your Organizations
                    </a>
                </p>
            </div>
        </div>
    );
}