"use client";

import {useState, useEffect, useRef} from "react";
import Link from "next/link";
import {Ticket, OrgMember, Tag, STATUS_LABELS, SEVERITY_LABELS} from "@/types/ticket";
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

function useDebounce(value: string, delay: number): string {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function FilterSelect({
                          label, value, onChange, children,
                      }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
}) {
    const active = !!value;
    return (
        <div className="flex flex-col gap-1.5">
            <span
                className={`text-xs font-semibold uppercase tracking-widest pl-0.5 transition-colors ${active ? 'text-black' : 'text-gray-400'}`}>
                {label}
            </span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`h-10 rounded-xl px-3 text-sm border outline-none cursor-pointer transition-all bg-white text-gray-800 focus:ring-2 focus:ring-black ${active ? 'border-black font-semibold ring-1 ring-black' : 'border-gray-200 font-medium hover:border-gray-400'}`}
            >
                {children}
            </select>
        </div>
    );
}

function ActiveChip({label, onRemove}: { label: string; onRemove: () => void }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium">
            {label}
            <button
                onClick={onRemove}
                className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 transition flex items-center justify-center text-xs font-bold leading-none"
            >
                ×
            </button>
        </span>
    );
}

export default function TicketsListClient({members, tags}: Props) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [severity, setSeverity] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [tag, setTag] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const debouncedSearch = useDebounce(search, 350);
    const cursorRef = useRef<string | null>(null);

    function buildQuery(cursor?: string | null) {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (status) params.set('status', status);
        if (severity) params.set('severity', severity);
        if (assigneeId) params.set('assignee_id', assigneeId);
        if (tag) params.set('tag', tag);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '20');
        return params.toString();
    }

    useEffect(() => {
        let cancelled = false;
        cursorRef.current = null;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/tickets?${buildQuery()}`);
                if (cancelled) return;
                if (!res.ok) {
                    const err = await res.json() as { error: string };
                    setError(err.error ?? 'Failed to load tickets');
                    return;
                }
                const data = await res.json() as TicketPage;
                if (cancelled) return;
                setTickets(data.tickets);
                setTotal(data.total);
                setNextCursor(data.nextCursor);
                setHasMore(data.hasMore);
            } catch (err: unknown) {
                if (!cancelled) setError((err as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, status, severity, assigneeId, tag, dateFrom, dateTo]);

    async function loadMore() {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        setError("");
        try {
            const res = await fetch(`/api/tickets?${buildQuery(nextCursor)}`);
            if (!res.ok) {
                const err = await res.json() as { error: string };
                setError(err.error ?? 'Failed to load more');
                return;
            }
            const data = await res.json() as TicketPage;
            setTickets(prev => [...prev, ...data.tickets]);
            setTotal(data.total);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoadingMore(false);
        }
    }

    function clearFilters() {
        setSearch("");
        setStatus("");
        setSeverity("");
        setAssigneeId("");
        setTag("");
        setDateFrom("");
        setDateTo("");
    }

    const hasActiveFilters = !!(search || status || severity || assigneeId || tag || dateFrom || dateTo);
    const activeChips = [
        search && {label: `"${search}"`, clear: () => setSearch("")},
        status && {label: STATUS_LABELS[status as keyof typeof STATUS_LABELS], clear: () => setStatus("")},
        severity && {label: `Severity ${severity}`, clear: () => setSeverity("")},
        assigneeId && {
            label: assigneeId === 'unassigned' ? 'Unassigned' : (members.find(m => m.user_id === assigneeId)?.email ?? assigneeId),
            clear: () => setAssigneeId("")
        },
        tag && {label: `#${tag}`, clear: () => setTag("")},
        dateFrom && {label: `From ${dateFrom}`, clear: () => setDateFrom("")},
        dateTo && {label: `To ${dateTo}`, clear: () => setDateTo("")},
    ].filter(Boolean) as { label: string; clear: () => void }[];

    return (
        <div className="space-y-5">

            {/* ── Filter panel ── */}
            <div className=" mb-10 p-3">

                {/* Filter controls */}
                <div className="px-5 pt-5 pb-4 space-y-4">

                    {/* Row 1 — Search + Status + Severity + Assignee */}
                    <div className="flex gap-3 items-end">
                        {/* Search — takes remaining space */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <span
                                className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-0.5">Search</span>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by title or description..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-black transition hover:border-gray-400"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")}
                                            ></button>
                                )}
                            </div>
                        </div>

                        <FilterSelect label="Status" value={status} onChange={setStatus}>
                            <option value="">All Statuses</option>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </FilterSelect>

                        <FilterSelect label="Severity" value={severity} onChange={setSeverity}>
                            <option value="">All Severities</option>
                            {SEVERITIES.map(s => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
                        </FilterSelect>

                        <FilterSelect label="Assignee" value={assigneeId} onChange={setAssigneeId}>
                            <option value="">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {members.map(m => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
                        </FilterSelect>
                    </div>

                    {/* Row 2 — Tag + Date From + Date To + count + clear */}
                    <div className="flex gap-3 items-end">
                        {tags.length > 0 && (
                            <FilterSelect label="Tag" value={tag} onChange={setTag}>
                                <option value="">All Tags</option>
                                {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </FilterSelect>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <span
                                className={`text-xs font-semibold uppercase tracking-widest pl-0.5 transition-colors ${dateFrom ? 'text-black' : 'text-gray-400'}`}>From</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className={`h-10 rounded-xl px-3 text-sm border outline-none transition-all bg-white text-gray-800 focus:ring-2 focus:ring-black ${dateFrom ? 'border-black font-semibold ring-1 ring-black' : 'border-gray-200 font-medium hover:border-gray-400'}`}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span
                                className={`text-xs font-semibold uppercase tracking-widest pl-0.5 transition-colors ${dateTo ? 'text-black' : 'text-gray-400'}`}>To</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className={`h-10 rounded-xl px-3 text-sm border outline-none transition-all bg-white text-gray-800 focus:ring-2 focus:ring-black ${dateTo ? 'border-black font-semibold ring-1 ring-black' : 'border-gray-200 font-medium hover:border-gray-400'}`}
                            />
                        </div>

                        {/* Push count + clear to the right */}
                        <div className="ml-auto flex items-end gap-3">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                                >
                                    Clear all
                                </button>
                            )}
                            <div
                                className="h-10 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-200 whitespace-nowrap">
                                {loading
                                    ? <span className="text-xs text-gray-400 font-medium">Searching...</span>
                                    : <span className="text-sm font-semibold text-gray-800">{total} <span
                                        className="font-normal text-gray-500">ticket{total !== 1 ? 's' : ''}</span></span>
                                }
                            </div>
                        </div>
                    </div>

                </div>

                {/* Active filter chips */}
                {hasActiveFilters && (
                    <div className="px-5 pb-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                        {activeChips.map(chip => (
                            <ActiveChip key={chip.label} label={chip.label} onRemove={chip.clear}/>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Tickets table ── */}
            <div className=" bg-white border-transparent backdrop-blur-xl shadow-xl overflow-hidden">

                {error && (
                    <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin"/>
                        <p className="text-sm text-gray-400">Loading tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-2">
                        <span className="text-5xl">🎫</span>
                        <p className="text-base font-semibold text-gray-700 mt-2">No tickets found</p>
                        <p className="text-sm text-gray-400">
                            {hasActiveFilters ? "Try changing or clearing your filters" : "Create your first ticket to get started"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Assignee</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Tags</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50/80 transition group">
                                        <td className="px-6 py-4">
                                            <Link href={`/tickets/${ticket.id}`}>
                                                <p className="font-semibold text-gray-900 group-hover:text-black truncate max-w-xs">{ticket.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">#{ticket.id.slice(0, 8)}</p>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4">
                                            <TicketStatusBadge status={ticket.status}/>
                                        </td>
                                        <td className="px-4 py-4">
                                            <SeverityBadge severity={ticket.severity}/>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell">
                                            {ticket.assignee_email
                                                ? <span className="text-sm text-gray-700">{ticket.assignee_email}</span>
                                                : <span className="text-sm text-gray-400">Unassigned</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4 hidden xl:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {ticket.tags?.slice(0, 2).map(t => (
                                                    <span key={t.id}
                                                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">{t.name}</span>
                                                ))}
                                                {ticket.tags?.length > 2 && (
                                                    <span
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-xs">+{ticket.tags.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(ticket.updated_at).toLocaleDateString(undefined, {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {tickets.map(ticket => (
                                <Link key={ticket.id} href={`/tickets/${ticket.id}`}
                                      className="flex flex-col gap-2 px-5 py-4 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold text-gray-900 text-sm leading-snug flex-1">{ticket.title}</p>
                                        <TicketStatusBadge status={ticket.status}/>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                                        <SeverityBadge severity={ticket.severity}/>
                                        <span>·</span>
                                        <span>{ticket.assignee_email ?? 'Unassigned'}</span>
                                        <span>·</span>
                                        <span>{new Date(ticket.updated_at).toLocaleDateString(undefined, {
                                            day: 'numeric',
                                            month: 'short'
                                        })}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Load more */}
                        {hasMore && (
                            <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing <span
                                    className="font-semibold text-gray-800">{tickets.length}</span> of <span
                                    className="font-semibold text-gray-800">{total}</span>
                                </p>
                                <button
                                    onClick={() => void loadMore()}
                                    disabled={loadingMore}
                                    className="bg-black text-white px-5 py-2 rounded-xl hover:bg-gray-800 transition text-sm font-medium disabled:opacity-50"
                                >
                                    {loadingMore ? "Loading..." : "Load more"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}