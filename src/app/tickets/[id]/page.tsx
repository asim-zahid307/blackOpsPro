import {requireAuth} from '@/lib/auth';
import {requireOrg} from '@/lib/orgContext';
import {getTicketById} from '@/lib/tickets';
import {notFound} from 'next/navigation';
import TicketStatusBadge from '@/lib/components/TicketStatusBadge';
import SeverityBadge from '@/lib/components/SeverityBadge';
import LogoutButton from '@/lib/components/LogoutButton';
import DeleteTicketButton from '@/lib/components/DeleteTicketButton';
import TicketTimeline from '@/lib/components/TicketTimeline';
import Link from 'next/link';
import {STATUS_TRANSITIONS, STATUS_LABELS} from '@/types/ticket';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({params}: PageProps) {
    const {id} = await params;

    const user = await requireAuth();
    const {orgId, role} = await requireOrg();

    const ticket = await getTicketById(id, orgId);
    if (!ticket) notFound();

    const canEdit = role !== 'viewer';
    const canDelete = role === 'owner' || role === 'admin';
    const canComment = role !== 'viewer';
    const nextStatuses = STATUS_TRANSITIONS[ticket.status];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            {/* NAVBAR */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">BO
                        </div>
                        <span className="text-lg font-semibold text-gray-800">BlackOps Pro</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                        <Link href="/tickets" className="text-sm text-gray-600 hover:text-black transition">←
                            Tickets</Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">

                {/* Top bar */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">#{ticket.id.slice(0, 8)}</p>
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Link
                                href={`/tickets/${ticket.id}/edit`}
                                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                            >
                                Edit
                            </Link>
                        )}
                        {canDelete && <DeleteTicketButton ticketId={ticket.id}/>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left — description + transitions + timeline */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Description */}
                        <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-6">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h2>
                            {ticket.description ? (
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
                            ) : (
                                <p className="text-gray-400 text-sm italic">No description provided.</p>
                            )}
                        </div>

                        {/* Status transitions */}
                        {canEdit && nextStatuses.length > 0 && (
                            <div
                                className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-6">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Transition
                                    Status</h2>
                                <p className="text-xs text-gray-400 mb-3">
                                    Current: <strong>{STATUS_LABELS[ticket.status]}</strong> — allowed next:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {nextStatuses.map(s => (
                                        <Link
                                            key={s}
                                            href={`/tickets/${ticket.id}/edit?status=${s}`}
                                            className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        >
                                            → {STATUS_LABELS[s]}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline + Comments */}
                        <TicketTimeline
                            ticketId={ticket.id}
                            canComment={canComment}
                            currentUserEmail={user.email}
                        />

                    </div>

                    {/* Right — metadata sidebar */}
                    <div className="space-y-4">
                        <div
                            className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-6 space-y-4">

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                                <TicketStatusBadge status={ticket.status}/>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Severity</p>
                                <SeverityBadge severity={ticket.severity}/>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assignee</p>
                                <p className="text-sm text-gray-700">
                                    {ticket.assignee_email ?? <span className="text-gray-400">Unassigned</span>}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created
                                    By</p>
                                <p className="text-sm text-gray-700">{ticket.created_by_email}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</p>
                                <p className="text-sm text-gray-700">{new Date(ticket.created_at).toLocaleString()}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last
                                    Updated</p>
                                <p className="text-sm text-gray-700">{new Date(ticket.updated_at).toLocaleString()}</p>
                            </div>

                            {ticket.tags && ticket.tags.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ticket.tags.map(tag => (
                                            <span key={tag.id}
                                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}