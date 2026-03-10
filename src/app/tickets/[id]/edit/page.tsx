"use client";

import {useState, useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import {Ticket, OrgMember, SEVERITY_LABELS, STATUS_LABELS, STATUS_TRANSITIONS, TicketStatus} from "@/types/ticket";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditTicketPage({params}: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedStatus = searchParams.get("status") as TicketStatus | null;

    const [ticketId, setTicketId] = useState<string>("");
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState(3);
    const [status, setStatus] = useState<TicketStatus>("open");
    const [assigneeId, setAssigneeId] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    // Resolve async params
    useEffect(() => {
        params.then(p => setTicketId(p.id));
    }, [params]);

    // Load ticket + members
    useEffect(() => {
        if (!ticketId) return;

        Promise.all([
            fetch(`/api/tickets/${ticketId}`).then(r => r.json()),
            fetch("/api/orgs/members").then(r => r.json()),
        ])
            .then(([ticketData, membersData]: [Ticket, OrgMember[]]) => {
                if ('error' in (ticketData as unknown as { error?: string })) {
                    setLoadError((ticketData as unknown as { error: string }).error);
                    return;
                }
                setTicket(ticketData);
                setTitle(ticketData.title);
                setDescription(ticketData.description ?? "");
                setSeverity(ticketData.severity);
                setStatus(preselectedStatus ?? ticketData.status);
                setAssigneeId(ticketData.assignee_id ?? "");
                setTags(ticketData.tags?.map(t => t.name) ?? []);
                setMembers(membersData);
            })
            .catch(err => setLoadError((err as Error).message))
            .finally(() => setLoading(false));
    }, [ticketId, preselectedStatus]);

    function addTag() {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed]);
        }
        setTagInput("");
    }

    function removeTag(tag: string) {
        setTags(prev => prev.filter(t => t !== tag));
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaveError("");
        setSaving(true);

        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    title,
                    description: description || null,
                    severity,
                    status,
                    assignee_id: assigneeId || null,
                    tags,
                }),
            });

            const data = await res.json() as { error?: string };

            if (res.ok) {
                router.push(`/tickets/${ticketId}`);
            } else {
                setSaveError(data.error ?? "Failed to save ticket");
            }
        } catch (err: unknown) {
            setSaveError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200">
                <p className="text-gray-500">Loading ticket...</p>
            </div>
        );
    }

    if (loadError || !ticket) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{loadError || "Ticket not found"}</p>
                    <Link href="/tickets" className="text-black underline text-sm">← Back to Tickets</Link>
                </div>
            </div>
        );
    }

    const allowedNextStatuses: TicketStatus[] = ticket.status === status
        ? [ticket.status, ...STATUS_TRANSITIONS[ticket.status]]
        : [ticket.status, ...STATUS_TRANSITIONS[ticket.status]];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">

            {/* NAVBAR */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                            BO
                        </div>
                        <span className="text-lg font-semibold text-gray-800">BlackOps Pro</span>
                    </div>
                    <Link href={`/tickets/${ticketId}`} className="text-sm text-gray-600 hover:text-black transition">
                        ← Back to Ticket
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Ticket</h1>
                    <p className="text-gray-500 mt-1 text-sm">#{ticketId.slice(0, 8)}</p>
                </div>

                <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                disabled={saving}
                                rows={4}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                value={status}
                                onChange={e => setStatus(e.target.value as TicketStatus)}
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            >
                                {/* Always show current status + allowed transitions */}
                                {allowedNextStatuses.map(s => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Only valid transitions from &quot;{STATUS_LABELS[ticket.status]}&quot; are shown.
                            </p>
                        </div>

                        {/* Severity */}
                        <div>
                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                                Severity <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="severity"
                                value={severity}
                                onChange={e => setSeverity(Number(e.target.value))}
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            >
                                {[1, 2, 3, 4, 5].map(n => (
                                    <option key={n} value={n}>
                                        {n} — {SEVERITY_LABELS[n]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                                Assignee
                            </label>
                            <select
                                id="assignee"
                                value={assigneeId}
                                onChange={e => setAssigneeId(e.target.value)}
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                    <option key={m.user_id} value={m.user_id}>
                                        {m.email} ({m.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black text-white rounded-full text-xs"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-gray-300 transition"
                                            aria-label={`Remove tag ${tag}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    id="tags"
                                    type="text"
                                    placeholder="Add tag and press Enter"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    disabled={saving}
                                    className="flex-1 rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    disabled={!tagInput.trim() || saving}
                                    className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 hover:bg-white text-sm font-medium disabled:opacity-40 transition"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {saveError && (
                            <p role="alert" className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                                {saveError}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <Link
                                href={`/tickets/${ticketId}`}
                                className="px-6 py-2.5 rounded-lg border border-gray-200 hover:bg-white transition font-medium text-sm text-gray-700"
                            >
                                Cancel
                            </Link>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}