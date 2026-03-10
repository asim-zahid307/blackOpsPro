"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {AuditLog} from "@/types/audit";

const ACTION_LABELS: Record<string, string> = {
    'ticket.created': 'Ticket Created',
    'ticket.updated': 'Ticket Updated',
    'ticket.deleted': 'Ticket Deleted',
    'ticket.status_changed': 'Status Changed',
    'ticket.assignee_changed': 'Assignee Changed',
    'ticket.severity_changed': 'Severity Changed',
    'ticket.tags_changed': 'Tags Changed',
    'comment.created': 'Comment Added',
    'org.member_invited': 'Member Invited',
    'org.member_removed': 'Member Removed',
    'org.role_changed': 'Role Changed',
};

const ACTION_STYLES: Record<string, string> = {
    'ticket.created': 'bg-green-100 text-green-800',
    'ticket.updated': 'bg-blue-100 text-blue-800',
    'ticket.deleted': 'bg-red-100 text-red-800',
    'ticket.status_changed': 'bg-yellow-100 text-yellow-800',
    'ticket.assignee_changed': 'bg-purple-100 text-purple-800',
    'ticket.severity_changed': 'bg-orange-100 text-orange-800',
    'ticket.tags_changed': 'bg-gray-100 text-gray-700',
    'comment.created': 'bg-indigo-100 text-indigo-800',
    'org.member_invited': 'bg-teal-100 text-teal-800',
    'org.member_removed': 'bg-red-100 text-red-800',
    'org.role_changed': 'bg-pink-100 text-pink-800',
};

function DataCell({data}: { data: Record<string, unknown> | null }) {
    if (!data || Object.keys(data).length === 0) return <span className="text-gray-400">—</span>;
    return (
        <div className="space-y-0.5">
            {Object.entries(data).map(([k, v]) => (
                <div key={k} className="text-xs">
                    <span className="text-gray-500">{k}:</span>{' '}
                    <span className="text-gray-800 font-medium">{String(v)}</span>
                </div>
            ))}
        </div>
    );
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    async function fetchLogs(newOffset: number, replace: boolean) {
        setLoading(true);
        try {
            const res = await fetch(`/api/audit?limit=${LIMIT}&offset=${newOffset}`);
            const data = await res.json() as AuditLog[] | { error: string };

            if ('error' in data) {
                setError(data.error);
                return;
            }

            setHasMore(data.length === LIMIT);
            setLogs(prev => replace ? data : [...prev, ...data]);
            setOffset(newOffset);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchLogs(0, true);
    }, []);

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
                        <Link href="/tickets"
                              className="text-sm text-gray-600 hover:text-black transition">Tickets</Link>
                        <Link href="/" className="text-sm text-gray-600 hover:text-black transition">Dashboard</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
                    <p className="text-gray-500 mt-1">
                        Immutable record of all actions in this organization. Admins see all activity; members see their
                        own.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div
                    className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg overflow-hidden">
                    {loading && logs.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">Loading audit logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-4xl mb-3">📋</p>
                            <p className="text-gray-500">No audit logs yet. Actions you take will appear here.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-gray-200 bg-white/60">
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Action</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700">Actor</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden md:table-cell">Entity</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden lg:table-cell">Before</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden lg:table-cell">After</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-700">Time</th>
                            </tr>
                            </thead>
                            <tbody>
                            {logs.map((log, idx) => (
                                <tr
                                    key={log.id}
                                    className={`border-b border-gray-100 hover:bg-white/60 transition ${idx % 2 === 0 ? '' : 'bg-white/20'}`}
                                >
                                    <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_STYLES[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {ACTION_LABELS[log.action] ?? log.action}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-700">{log.actor_email}</td>
                                    <td className="px-4 py-4 hidden md:table-cell">
                                        <div>
                                            <span className="text-xs text-gray-500 capitalize">{log.entity_type}</span>
                                            {log.entity_id && (
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                    {log.entity_type === 'ticket' ? (
                                                        <p className="text-blue-600">
                                                            #{log.entity_id.slice(0, 8)}
                                                        </p>
                                                    ) : (
                                                        `#${log.entity_id.slice(0, 8)}`
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 hidden lg:table-cell">
                                        <DataCell data={log.old_data}/>
                                    </td>
                                    <td className="px-4 py-4 hidden lg:table-cell">
                                        <DataCell data={log.new_data}/>
                                    </td>
                                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}

                    {/* Load more */}
                    {hasMore && !loading && (
                        <div className="px-6 py-4 border-t border-gray-100 text-center">
                            <button
                                onClick={() => void fetchLogs(offset + LIMIT, false)}
                                className="text-sm text-gray-600 hover:text-black transition font-medium"
                            >
                                Load more →
                            </button>
                        </div>
                    )}
                    {loading && logs.length > 0 && (
                        <div className="px-6 py-4 text-center text-sm text-gray-400">Loading...</div>
                    )}
                </div>
            </main>
        </div>
    );
}