import {requireAuth} from '@/lib/auth';
import {requireOrg} from '@/lib/orgContext';
import {getOrgMembers, getOrgTags} from '@/lib/tickets';
import LogoutButton from '@/lib/components/LogoutButton';
import Link from 'next/link';
import TicketsListClient from '@/lib/components/TicketsListClient';
import {OrgMember} from '@/types/ticket';
import {Tag} from '@/types/ticket';

export default async function TicketsPage() {
    const user = await requireAuth();
    const {orgId, role} = await requireOrg();

    const [members, tags] = await Promise.all([
        getOrgMembers(orgId),
        getOrgTags(orgId),
    ]);

    const canCreate = role !== 'viewer';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BO
                        </div>
                        <span className="text-lg font-semibold text-gray-800">BlackOps Pro</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                        <Link href="/" className="text-sm text-gray-600 hover:text-black transition">Dashboard</Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
                        <p className="text-gray-500 mt-1 text-sm">Search, filter and manage tickets</p>
                    </div>
                    {canCreate && (
                        <Link
                            href="/tickets/new"
                            className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
                        >
                            + New Ticket
                        </Link>
                    )}
                </div>

                <TicketsListClient
                    members={members as OrgMember[]}
                    tags={tags as Tag[]}
                    canCreate={canCreate}
                />
            </main>
        </div>
    );
}