import {requireAuth} from "@/lib/auth";
import {query} from "@/lib/db";
import LogoutButton from "@/lib/components/LogoutButton";
import Link from "next/link";
import EnterOrgButton from "@/lib/components/EnterOrgButton";

interface OrgWithStats {
    id: string;
    name: string;
    total_users: number;
    total_tickets: number;
}

async function getAllOrgsWithStats(): Promise<OrgWithStats[]> {
    const result = await query(`
        SELECT o.id,
               o.name,
               COUNT(DISTINCT uo.user_id)::int AS total_users, COUNT(DISTINCT t.id) ::int       AS total_tickets
        FROM organizations o
                 LEFT JOIN user_organizations uo ON o.id = uo.org_id
                 LEFT JOIN tickets t ON o.id = t.org_id
        GROUP BY o.id
        ORDER BY o.name
    `);

    return result.rows as OrgWithStats[];
}

export default async function DashboardPage() {
    const user = await requireAuth();
    const orgs = await getAllOrgsWithStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            {/* NAVBAR */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30 z-10">
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
                            href="/tickets"
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 inline-block text-center text-sm"
                        >
                            Tickets
                        </Link>
                        <Link
                            href="/org"
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-white inline-block text-center text-sm"
                        >
                            Your Org
                        </Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations Overview</h1>
                    <p className="text-gray-600">Select an organization to enter its workspace.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {orgs.length > 0 ? (
                        orgs.map((org) => (
                            <div
                                key={org.id}
                                className="relative overflow-hidden rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg flex flex-col items-center"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-60"/>
                                <div className="relative z-10 text-center w-full">
                                    <div
                                        className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center font-semibold mb-4 mx-auto">
                                        ORG
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-3">{org.name}</h2>

                                    {/* Stats row */}
                                    <div className="flex justify-center gap-6 mb-5">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-gray-900">{org.total_users}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {org.total_users === 1 ? 'Member' : 'Members'}
                                            </p>
                                        </div>
                                        <div className="w-px bg-gray-200"/>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">{org.total_tickets}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {org.total_tickets === 1 ? 'Ticket' : 'Tickets'}
                                            </p>
                                        </div>
                                    </div>

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

            <footer className="text-center text-sm text-gray-500 pb-8">
                BlackOps Pro • Dashboard
            </footer>
        </div>
    );
}