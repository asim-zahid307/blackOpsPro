"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {OrgMember, SEVERITY_LABELS} from "@/types/ticket";

export default function NewTicketPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState(3);
    const [assigneeId, setAssigneeId] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/orgs/members")
            .then(r => r.json())
            .then((data: OrgMember[]) => setMembers(data))
            .catch(console.error);
    }, []);

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
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    title,
                    description: description || undefined,
                    severity,
                    assignee_id: assigneeId || undefined,
                    tags: tags.length > 0 ? tags : undefined,
                }),
            });

            const data = await res.json() as { id?: string; error?: string };

            if (res.ok && data.id) {
                router.push(`/tickets/${data.id}`);
            } else {
                setError(data.error ?? "Failed to create ticket");
            }
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

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
                    <Link href="/tickets" className="text-sm text-gray-600 hover:text-black transition">
                        ← Back to Tickets
                    </Link>
                </div>
            </header>

            {/* FORM */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">New Ticket</h1>
                    <p className="text-gray-500 mt-1">Create a new incident or task</p>
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
                                placeholder="Brief description of the issue"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                disabled={loading}
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
                                placeholder="Detailed description of the issue..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                disabled={loading}
                                rows={4}
                                className="w-full rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
                            />
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
                                disabled={loading}
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
                                disabled={loading}
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
                                    disabled={loading}
                                    className="flex-1 rounded-lg border border-gray-200 bg-white/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    disabled={!tagInput.trim() || loading}
                                    className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white/70 hover:bg-white text-sm font-medium disabled:opacity-40 transition"
                                >
                                    Add
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <p role="alert" className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium text-sm disabled:opacity-60"
                            >
                                {loading ? "Creating..." : "Create Ticket"}
                            </button>
                            <Link
                                href="/tickets"
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