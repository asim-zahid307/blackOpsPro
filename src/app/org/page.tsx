import {requireAuth} from "@/lib/auth";
import {queryOne} from "@/lib/db";
import LogoutButton from "@/lib/components/LogoutButton";

export default async function OrgPage() {
    const user = await requireAuth();

    const org = await queryOne(`
        SELECT o.*
        FROM organizations o
                 JOIN user_organizations uo ON uo.org_id = o.id
        WHERE uo.user_id = $1
    `, [user.userId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BO
                        </div>
                        <span className="text-lg font-semibold">BlackOps Pro</span>
                    </div>
                    <span className="text-sm hidden sm:block">{user.email}</span>
                    <span className="text-sm text-gray-500">
                        <LogoutButton/>
                     </span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-2">Your Organization</h1>
                <p className="text-gray-600 mb-8">Details of the organization you belong to.</p>

                {org ? (
                    <div className="rounded-2xl p-8 border bg-white/40 backdrop-blur-xl shadow-lg text-center">
                        <div
                            className="h-12 w-12 mx-auto rounded-xl bg-black text-white flex items-center justify-center font-semibold mb-4">ORG
                        </div>
                        <h2 className="text-lg font-semibold mb-2">{org.name}</h2>
                        <p className="text-sm text-gray-600">Organization ID: {org.id}</p>
                    </div>
                ) : (
                    <p>No organization assigned.</p>
                )}
            </main>
        </div>
    );
}