import {requireAuth} from "@/lib/auth";

export default async function OrgPage() {
    const user = await requireAuth();

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
            <div
                className="w-full max-w-3xl p-8 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                    Welcome, <span className="text-blue-600">{user.email}</span>
                </h1>

                <p className="text-slate-600 mb-6">
                    Your organizations will appear here.
                </p>

                <a
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-3 text-sm font-medium text-white transition hover:brightness-110 hover:shadow-lg hover:shadow-slate-500/30 active:scale-[0.98]"
                >
                    ← Back to Home
                </a>
            </div>
        </div>
    );
}