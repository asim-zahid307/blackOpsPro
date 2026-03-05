import {requireAuth} from "@/lib/auth";

export default async function OrgPage() {
    const user = await requireAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            {/* NAVBAR */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                            BO
                        </div>

                        <span className="text-lg font-semibold text-gray-800">
              BlackOps Pro
            </span>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">

            <span className="text-sm text-gray-700 hidden sm:block">
              {user.email}
            </span>

                        <a
                            href="/"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition"
                        >
                            Dashboard
                        </a>

                    </div>

                </div>
            </header>

            {/* CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-12">

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Your Organizations
                    </h1>

                    <p className="text-gray-600">
                        Manage the organizations you belong to.
                    </p>
                </div>

                {/* ORGANIZATION AREA */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    <div
                        className="rounded-2xl p-8 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg text-center">

                        <div
                            className="h-12 w-12 mx-auto rounded-xl bg-black text-white flex items-center justify-center font-semibold mb-4">
                            ORG
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            No Organizations Yet
                        </h2>

                        <p className="text-sm text-gray-600">
                            Your organizations will appear here once created.
                        </p>

                    </div>

                </div>

            </main>

            {/* FOOTER */}
            <footer className="text-center text-sm text-gray-500 pb-8">
                BlackOps Pro • Organizations
            </footer>

        </div>
    );
}