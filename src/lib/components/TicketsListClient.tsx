"use client";

import {useState, useEffect, useCallback, useRef} from "react";
import Link from "next/link";
import {Ticket, OrgMember, Tag, STATUS_LABELS, SEVERITY_LABELS} from "@/types/ticket";
import {TicketFilters} from "@/types/filters";
import TicketStatusBadge from "./TicketStatusBadge";
import SeverityBadge from "./SeverityBadge";

interface TicketPage {
    tickets: Ticket[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
}

interface Props {
    members: OrgMember[];
    tags: Tag[];
    canCreate: boolean;
}

const STATUSES = ['open', 'investigating', 'mitigated', 'resolved'] as const;
const SEVERITIES = [1, 2, 3, 4, 5] as const;

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function TicketsListClient({members, tags}: Props) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [severity, setSeverity] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [tag, setTag] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const debouncedSearch = useDebounce(search, 300);
    const isFirstLoad = useRef(true);

    const buildParams = useCallback((filters: TicketFilters, cursor?: string) => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.status) params.set('status', filters.status);
        if (filters.severity) params.set('severity', String(filters.severity));
        if (filters.assignee_id) params.set('assignee_id', filters.assignee_id);
        if (filters.tag) params.set('tag', filters.tag);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '20');
        return params.toString();
    }, []);

    const fetchTickets = useCallback(async (cursor?: string, append = false) => {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        setError("");

        const filters: TicketFilters = {
            search: debouncedSearch || undefined,
            status: status as TicketFilters['status'] || undefined,
            severity: severity ? Number(severity) : undefined,
            assignee_id: assigneeId || undefined,
            tag: tag || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        };

        try {
            const res = await fetch(`/api/tickets?${buildParams(filters, cursor)}`);
            const data = await res.json() as TicketPage | { error: string };

            if ('error' in data) {
                setError(data.error);
                return;
            }

            if (append) {
                setTickets(prev => [...prev, ...data.tickets]);
            } else {
                setTickets(data.tickets);
            }
            setTotal(data.total);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [debouncedSearch, status, severity, assigneeId, tag, dateFrom, dateTo, buildParams]);

    // Initial load
    useEffect(() => {
        void fetchTickets();
    }, [fetchTickets]);

    // Reset and refetch when filters change (skip on very first render)
    useEffect(() => {
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            return;
        }
        void fetchTickets();
    }, [debouncedSearch, status, severity, assigneeId, tag, dateFrom, dateTo, fetchTickets]);

    function clearFilters() {
        setSearch("");
        setStatus("");
        setSeverity("");
        setAssigneeId("");
        setTag("");
        setDateFrom("");
        setDateTo("");
    }

    const hasActiveFilters = search || status || severity || assigneeId || tag || dateFrom || dateTo;

    return (
        <div className="space-y-6">

            {/* Filter bar */}
            <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">

                    {/* Search */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Search titles and descriptions..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>

                    {/* Severity */}
                    <select
                        value={severity}
                        onChange={e => setSeverity(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">All Severities</option>
                        {SEVERITIES.map(s => (
                            <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                        ))}
                    </select>

                    {/* Assignee */}
                    <select
                        value={assigneeId}
                        onChange={e => setAssigneeId(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">All Assignees</option>
                        <option value="unassigned">Unassigned</option>
                        {members.map(m => (
                            <option key={m.user_id} value={m.user_id}>{m.email}</option>
                        ))}
                    </select>

                    {/* Tag */}
                    <select
                        value={tag}
                        onChange={e => setTag(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">All Tags</option>
                        {tags.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                    </select>

                    {/* Date From */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Created from</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Created to</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                {/* Active filter summary + clear */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {loading ? "Loading..." : (
                            <>
                                <span
                                    className="font-semibold text-gray-800">{total}</span> ticket{total !== 1 ? 's' : ''} found
                                {hasActiveFilters && <span className="text-gray-400"> (filtered)</span>}
                            </>
                        )}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-gray-500 hover:text-black transition underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            </div>

            {/* Tickets table */}
            <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg overflow-hidden">
                {error && (
                    <div className="px-6 py-4 bg-red-50 text-red-600 text-sm">{error}</div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-3xl mb-3 animate-pulse">⏳</p>
                        <p>Loading tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-3">🎫</p>
                        <p className="text-gray-500 font-medium">No tickets found</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {hasActiveFilters ? "Try adjusting your filters" : "Create your first ticket to get started"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-gray-200 bg-white/60">
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Title</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-700">Severity</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden lg:table-cell">Assignee</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-700 hidden xl:table-cell">Tags</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-700">Updated</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tickets.map((ticket, idx) => (
                                    <tr
                                        key={ticket.id}
                                        className={`border-b border-gray-100 hover:bg-white/60 transition cursor-pointer ${idx % 2 === 0 ? '' : 'bg-white/20'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <Link href={`/tickets/${ticket.id}`} className="group">
                                                <p className="font-medium text-gray-900 group-hover:underline line-clamp-1">{ticket.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">#{ticket.id.slice(0, 8)}</p>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4">
                                            <TicketStatusBadge status={ticket.status}/>
                                        </td>
                                        <td className="px-4 py-4">
                                            <SeverityBadge severity={ticket.severity}/>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">
                                            {ticket.assignee_email ?? <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-4 hidden xl:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {ticket.tags?.slice(0, 3).map(t => (
                                                    <span key={t.id}
                                                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t.name}</span>
                                                ))}
                                                {ticket.tags?.length > 3 && (
                                                    <span
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">+{ticket.tags.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(ticket.updated_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {tickets.map(ticket => (
                                <Link
                                    key={ticket.id}
                                    href={`/tickets/${ticket.id}`}
                                    className="flex flex-col gap-2 px-5 py-4 hover:bg-white/60 transition"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-gray-900 text-sm leading-snug">{ticket.title}</p>
                                        <TicketStatusBadge status={ticket.status}/>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <SeverityBadge severity={ticket.severity}/>
                                        <span>·</span>
                                        <span>{ticket.assignee_email ?? 'Unassigned'}</span>
                                        <span>·</span>
                                        <span>{new Date(ticket.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Load more */}
                        {hasMore && (
                            <div className="px-6 py-5 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => void fetchTickets(nextCursor ?? undefined, true)}
                                    disabled={loadingMore}
                                    className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm font-medium disabled:opacity-50"
                                >
                                    {loadingMore ? "Loading..." : `Load more (${total - tickets.length} remaining)`}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}