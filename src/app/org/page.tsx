import {cookies} from "next/headers";
import {queryOne, query} from "@/lib/db";
import {requireAuth} from "@/lib/auth";
import LogoutButton from "@/lib/components/LogoutButton";
import MemberRoleManager from "@/lib/components/MemberRoleManager";
import Link from "next/link";
import {OrgMember} from "@/types/ticket";

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

interface UserRole {
    role: string;
}

const ROLE_STYLES: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-600',
};

async function getOrgStats(orgId: string): Promise<OrgStats> {
    const result = await query(
        `SELECT (SELECT COUNT(*) FROM user_organizations WHERE org_id = $1)::int AS total_members, (SELECT COUNT(*) FROM tickets WHERE org_id = $1 AND deleted_at IS NULL)::int AS total_tickets, (SELECT COUNT(*)
                                                                                                                                                                                                   FROM tickets
                                                                                                                                                                                                   WHERE org_id = $1
                                                                                                                                                                                                     AND status = 'open'
                                                                                                                                                                                                     AND deleted_at IS NULL) ::int AS open_tickets`,
        [orgId]
    );
    return result.rows[0] as OrgStats;
}

async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
    const result = await query(
        `SELECT uo.user_id, u.email, uo.role
         FROM user_organizations uo
                  JOIN users u ON u.id = uo.user_id
         WHERE uo.org_id = $1
         ORDER BY CASE uo.role
                      WHEN 'owner' THEN 1
                      WHEN 'admin' THEN 2
                      WHEN 'member' THEN 3
                      WHEN 'viewer' THEN 4
                      END, u.email`,
        [orgId]
    );
    return result.rows as OrgMember[];
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
             WHERE uo.user_id = $1
               AND o.id = $2`,
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

    const resolvedOrgId = org?.id ?? currentOrgId;

    const userRole = resolvedOrgId
        ? await queryOne<UserRole>(
            `SELECT role
             FROM user_organizations
             WHERE user_id = $1
               AND org_id = $2`,
            [user.userId, resolvedOrgId]
        )
        : null;

    const role = userRole?.role ?? 'viewer';
    const canCreate = role !== 'viewer';
    const canManage = role === 'admin' || role === 'owner';

    const stats = org ? await getOrgStats(org.id) : null;
    // Only admins and owners can see the full member list
    const members = (org && canManage) ? await getOrgMembers(org.id) : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BO
                        </div>
                        <span className="text-lg font-semibold">BlackOps Pro</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm hidden sm:block text-gray-600">{user.email}</span>
                        <Link href="/" className="text-sm text-gray-600 hover:text-black transition">← Dashboard</Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {org && stats ? (
                    <>
                        {/* Org header with role badge */}
                        <div className="mb-10 flex flex-wrap items-center gap-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Organization</p>
                                <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
                                <p className="text-sm text-gray-500 mt-1">ID: {org.id}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-xs text-gray-400 mb-1">Your Role</p>
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize ${ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {role}
                                </span>
                            </div>
                        </div>

                        {/* Stats cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                            <div
                                className="rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Members</p>
                                <p className="text-4xl font-bold text-gray-900">{stats.total_members}</p>
                            </div>
                            <div
                                className="rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Tickets</p>
                                <p className="text-4xl font-bold text-gray-900">{stats.total_tickets}</p>
                            </div>
                            <div
                                className="rounded-2xl p-6 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg">
                                <p className="text-sm font-medium text-gray-500 mb-1">Open Tickets</p>
                                <p className="text-4xl font-bold text-blue-600">{stats.open_tickets}</p>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div
                            className="rounded-2xl p-8 border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/tickets"
                                      className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm">
                                    View All Tickets
                                </Link>
                                {canCreate && (
                                    <Link href="/tickets/new"
                                          className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-white transition font-medium text-sm">
                                        + New Ticket
                                    </Link>
                                )}
                                {role !== 'viewer' && (
                                    <Link href="/audit"
                                          className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-white transition font-medium text-sm">
                                        Audit Log
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Members — only visible to admin/owner */}
                        {canManage && (
                            <MemberRoleManager
                                members={members}
                                currentUserId={user.userId}
                                currentUserRole={role}
                            />
                        )}
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No organization assigned or access denied.</p>
                        <Link href="/" className="text-black underline text-sm mt-4 inline-block">← Back to
                            Dashboard</Link>
                    </div>
                )}
            </main>
        </div>
    );
}