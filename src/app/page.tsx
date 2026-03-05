import {requireAuth} from "@/lib/auth";
import LogoutButton from "@/lib/components/LogoutButton";

export default async function DashboardPage() {
    const user = await requireAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            {/* NAVBAR */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                            BO
                        </div>

                        <span className="text-lg font-semibold text-gray-800">
              BlackOps Pro
            </span>
                    </div>

                    <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 hidden sm:block">
              {user.email}
            </span>
                        <LogoutButton/>
                    </div>

                </div>
            </header>


            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* WELCOME */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back 👋
                    </h1>

                    <p className="text-gray-600">
                        Manage your organizations and projects.
                    </p>
                </div>


                {/* ORGANIZATION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* CARD */}
                    <a
                        href="/org"
                        className="group relative overflow-hidden rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg hover:shadow-2xl transition"
                    >

                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-60 group-hover:opacity-80 transition"></div>

                        <div className="relative z-10">

                            <div
                                className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center font-semibold mb-4">
                                ORG
                            </div>

                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                Your Organizations
                            </h2>

                            <p className="text-sm text-gray-600">
                                Access and manage your organization workspace.
                            </p>

                        </div>

                    </a>


                    {/* FUTURE CARD */}
                    <div
                        className="rounded-2xl p-6 border border-dashed border-gray-300 bg-white/30 backdrop-blur-xl flex items-center justify-center text-gray-500">
                        More features coming soon
                    </div>

                </div>

            </main>


            {/* FOOTER */}
            <footer className="text-center text-sm text-gray-500 pb-8">
                BlackOps Pro • Dashboard
            </footer>

        </div>
    );
}