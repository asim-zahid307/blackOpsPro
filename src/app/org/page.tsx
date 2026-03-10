import {cookies} from "next/headers";
import {queryOne, query} from "@/lib/db";
import {requireAuth} from "@/lib/auth";
import LogoutButton from "@/lib/components/LogoutButton";
import Link from "next/link";

interface Organization {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

interface OrgStats {
    total_members: number;
    total_tickets: number;
    open_tickets: number;
}

async function getOrgStats(orgId: string): Promise<OrgStats> {
    const result = await query(
        `SELECT (SELECT COUNT(*) FROM user_organizations WHERE org_id = $1)::int        AS total_members, (SELECT COUNT(*) FROM tickets WHERE org_id = $1)::int                   AS total_tickets, (SELECT COUNT(*) FROM tickets WHERE org_id = $1 AND status = 'open') ::int AS open_tickets
        `,
        [orgId]
    );
    return result.rows[0] as OrgStats;
}

export default async function OrgPage() {
    const user = await requireAuth();

    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("current_org_id")?.value;

    const org = currentOrgId
        ? await queryOne<Organization>(
            `SELECT o.*
             FROM organizations o
             JOIN user_organizations uo ON uo.org_id = o.id
             WHERE uo.user_id = $1 AND o.id = $2`,
            [user.userId, currentOrgId]
        )
        : await queryOne<Organization>(
            `SELECT o.*
             FROM organizations o
                      JOIN user_organizations uo ON uo.org_id = o.id
             WHERE uo.user_id = $1
             ORDER BY o.name LIMIT 1`,
            [user.userId]
        );

    const stats = org ? await getOrgStats(org.id) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            {/* HEADER */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                            BO
                        </div>
                        <span className="text-lg font-semibold">BlackOps Pro</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm hidden sm:block text-gray-600">{user.email}</span>
                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-black transition"
                        >
                            ← Dashboard
                        </Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {org && stats ? (
                    <>
                        {/* Org header */}
                        <div className="mb-10">
                            <p className="text-sm text-gray-400 mb-1">Organization</p>
                            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">ID: {org.id}</p>
                        </div>

                        {/* Stats cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">

                            {/* Members */}
                            <div
                                className="rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Members</p>
                                <p className="text-4xl font-bold text-gray-900">{stats.total_members}</p>
                            </div>

                            {/* Total Tickets */}
                            <div
                                className="rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Tickets</p>
                                <p className="text-4xl font-bold text-gray-900">{stats.total_tickets}</p>
                            </div>

                            {/* Open Tickets */}
                            <div
                                className="rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                                <p className="text-sm font-medium text-gray-500 mb-1">Open Tickets</p>
                                <p className="text-4xl font-bold text-blue-600">{stats.open_tickets}</p>
                            </div>

                        </div>

                        {/* Quick actions */}
                        <div className="rounded-2xl p-8 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/tickets"
                                    className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
                                >
                                    View All Tickets
                                </Link>
                                <Link
                                    href="/tickets/new"
                                    className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-white transition font-medium text-sm"
                                >
                                    + New Ticket
                                </Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No organization assigned or access denied.</p>
                        <Link href="/" className="text-black underline text-sm mt-4 inline-block">
                            ← Back to Dashboard
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}