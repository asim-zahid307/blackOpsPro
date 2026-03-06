// src/app/dashboard/page.tsx
import {requireAuth} from "@/lib/auth";
import {query} from "@/lib/db";
import LogoutButton from "@/lib/components/LogoutButton";
import Link from "next/link";
import EnterOrgButton from "@/lib/components/EnterOrgButton";

interface OrgWithUsers {
    id: string;
    name: string;
    total_users: number;
}

async function getAllOrgsWithUserCount(): Promise<OrgWithUsers[]> {
    const result = await query(`
        SELECT o.id, o.name, COUNT(uo.user_id) AS total_users
        FROM organizations o
                 LEFT JOIN user_organizations uo ON o.id = uo.org_id
        GROUP BY o.id
        ORDER BY o.name
    `);

    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        total_users: parseInt(row.total_users, 10),
    }));
}

export default async function DashboardPage() {
    const user = await requireAuth();
    const orgs = await getAllOrgsWithUserCount();

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
                        <span className="text-lg font-semibold text-gray-800">BlackOps Pro</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700 hidden sm:block">{user.email}</span>

                        <Link
                            href="/org"
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 inline-block text-center"
                        >
                            Your Organization
                        </Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations Overview</h1>
                    <p className="text-gray-600">View all organizations and total users.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {orgs.length > 0 ? (
                        orgs.map((org) => (
                            <div
                                key={org.id}
                                className="relative overflow-hidden rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg flex flex-col items-center"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-60"></div>
                                <div className="relative z-10 text-center w-full">
                                    <div
                                        className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center font-semibold mb-4 mx-auto">
                                        ORG
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{org.name}</h2>
                                    <p className="text-sm text-gray-600 mb-4">Total users: {org.total_users}</p>

                                    {/* Enter Organization Button */}
                                    <EnterOrgButton orgId={org.id} orgName={org.name}/>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-500">No organizations found</p>
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            <footer className="text-center text-sm text-gray-500 pb-8">BlackOps Pro • Dashboard</footer>
        </div>
    );
}