import {requireAuth} from '@/lib/auth';
import {requireOrg} from '@/lib/orgContext';
import {getTickets} from '@/lib/tickets';
import TicketStatusBadge from '@/lib/components/TicketStatusBadge';
import SeverityBadge from '@/lib/components/SeverityBadge';
import LogoutButton from '@/lib/components/LogoutButton';
import Link from 'next/link';

export default async function TicketsPage() {
    const user = await requireAuth();
    const {orgId, role} = await requireOrg();
    const tickets = await getTickets(orgId);

    const canCreate = role !== 'viewer';

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
                        <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                        <Link href="/" className="text-sm text-gray-600 hover:text-black transition">
                            Dashboard
                        </Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
                        <p className="text-gray-500 mt-1">
                            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} in this organization
                        </p>
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

                {/* Empty state */}
                {tickets.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl">
                        <p className="text-4xl mb-4">🎫</p>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h2>
                        <p className="text-gray-500 mb-6">Create your first ticket to get started.</p>
                        {canCreate && (
                            <Link
                                href="/tickets/new"
                                className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
                            >
                                Create Ticket
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Tickets table */
                    <div
                        className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-gray-200 bg-white/60">
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Title</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700">Status</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700">Severity</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden md:table-cell">Assignee</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden lg:table-cell">Tags</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden lg:table-cell">Updated</th>
                                <th className="px-4 py-4"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {tickets.map((ticket, idx) => (
                                <tr
                                    key={ticket.id}
                                    className={`border-b border-gray-100 hover:bg-white/60 transition ${idx % 2 === 0 ? '' : 'bg-white/20'}`}
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900 truncate max-w-xs">{ticket.title}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">#{ticket.id.slice(0, 8)}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <TicketStatusBadge status={ticket.status}/>
                                    </td>
                                    <td className="px-4 py-4">
                                        <SeverityBadge severity={ticket.severity}/>
                                    </td>
                                    <td className="px-4 py-4 hidden md:table-cell text-gray-600">
                                        {ticket.assignee_email ?? (
                                            <span className="text-gray-400">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 hidden lg:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {ticket.tags?.map(tag => (
                                                <span
                                                    key={tag.id}
                                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                                >
                                                        {tag.name}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 hidden lg:table-cell text-gray-400 text-xs">
                                        {new Date(ticket.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/tickets/${ticket.id}`}
                                            className="text-black font-medium hover:underline text-sm"
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}