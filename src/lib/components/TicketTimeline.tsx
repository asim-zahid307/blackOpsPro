"use client";

import {useState, useEffect, useRef} from "react";
import {TicketEvent, Comment} from "@/types/timeline";

interface Props {
    ticketId: string;
    canComment: boolean;
    currentUserEmail: string;
}

type TimelineItem =
    | (TicketEvent & { kind: "event" })
    | (Comment & { kind: "comment" });

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString();
}

function EventIcon({type}: { type: string }) {
    const icons: Record<string, string> = {
        ticket_created: "🎫",
        status_changed: "🔄",
        assignee_changed: "👤",
        tags_changed: "🏷️",
        severity_changed: "⚡",
        comment_added: "💬",
    };
    return <span>{icons[type] ?? "📌"}</span>;
}

function EventDescription({event}: { event: TicketEvent }) {
    switch (event.event_type) {
        case "ticket_created":
            return <span><strong>{event.actor_email}</strong> created this ticket</span>;
        case "status_changed":
            return (
                <span>
                    <strong>{event.actor_email}</strong> changed status from{" "}
                    <span className="font-medium text-gray-700 capitalize">{event.old_value}</span> to{" "}
                    <span className="font-medium text-gray-700 capitalize">{event.new_value}</span>
                </span>
            );
        case "assignee_changed":
            return (
                <span>
                    <strong>{event.actor_email}</strong> changed assignee from{" "}
                    <span className="font-medium text-gray-700">{event.old_value}</span> to{" "}
                    <span className="font-medium text-gray-700">{event.new_value}</span>
                </span>
            );
        case "tags_changed":
            return (
                <span>
                    <strong>{event.actor_email}</strong> updated tags: {event.new_value || "none"}
                </span>
            );
        case "severity_changed":
            return (
                <span>
                    <strong>{event.actor_email}</strong> changed severity from{" "}
                    <span className="font-medium text-gray-700">{event.old_value}</span> to{" "}
                    <span className="font-medium text-gray-700">{event.new_value}</span>
                </span>
            );
        case "comment_added":
            return (
                <span>
                    <strong>{event.actor_email}</strong> added a comment
                </span>
            );
        default:
            return <span><strong>{event.actor_email}</strong> made a change</span>;
    }
}

export default function TicketTimeline({ticketId, canComment, currentUserEmail}: Props) {
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [merged, setMerged] = useState<TimelineItem[]>([]);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load timeline + comments
    useEffect(() => {
        async function load() {
            try {
                const [eventsRes, commentsRes] = await Promise.all([
                    fetch(`/api/tickets/${ticketId}/timeline`),
                    fetch(`/api/tickets/${ticketId}/comments`),
                ]);
                const [eventsData, commentsData] = await Promise.all([
                    eventsRes.json() as Promise<TicketEvent[]>,
                    commentsRes.json() as Promise<Comment[]>,
                ]);
                setEvents(eventsData);
                setComments(commentsData);
            } catch (err) {
                console.error("Failed to load timeline", err);
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [ticketId]);

    // Merge and sort events + comments by created_at
    useEffect(() => {
        const allItems: TimelineItem[] = [
            ...events.filter(e => e.event_type !== "comment_added").map(e => ({...e, kind: "event" as const})),
            ...comments.map(c => ({...c, kind: "comment" as const})),
        ];
        allItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMerged(allItems);
    }, [events, comments]);

    // Scroll to bottom when timeline updates
    useEffect(() => {
        if (!loading) {
            bottomRef.current?.scrollIntoView({behavior: "smooth"});
        }
    }, [merged, loading]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;

        setError("");

        // Optimistic update — add comment immediately to UI
        const optimisticComment: Comment = {
            id: `optimistic-${Date.now()}`,
            ticket_id: ticketId,
            org_id: "",
            user_id: "",
            user_email: currentUserEmail,
            content: content.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setComments(prev => [...prev, optimisticComment]);
        const sentContent = content.trim();
        setContent("");
        setSubmitting(true);

        try {
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({content: sentContent}),
            });

            const data = await res.json() as Comment & { error?: string };

            if (res.ok) {
                // Replace optimistic with real comment
                setComments(prev =>
                    prev.map(c => c.id === optimisticComment.id ? data : c)
                );
            } else {
                // Remove optimistic comment and show error
                setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
                setContent(sentContent);
                setError(data.error ?? "Failed to post comment");
            }
        } catch (err: unknown) {
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setContent(sentContent);
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
                Timeline & Comments
            </h2>

            {/* Timeline feed */}
            <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-1">
                {loading ? (
                    <p className="text-sm text-gray-400 text-center py-6">Loading timeline...</p>
                ) : merged.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
                ) : (
                    merged.map(item => (
                        item.kind === "comment" ? (
                            // Comment bubble
                            <div key={item.id} className="flex gap-3">
                                <div
                                    className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {item.user_email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div
                                        className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm ${item.id.startsWith("optimistic") ? "bg-gray-100 opacity-60" : "bg-white shadow-sm"}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-800 text-xs">{item.user_email}</span>
                                            <span className="text-xs text-gray-400">{formatTime(item.created_at)}</span>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                                        {item.id.startsWith("optimistic") && (
                                            <p className="text-xs text-gray-400 mt-1">Sending...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // System event pill
                            <div key={item.id} className="flex items-center gap-3 text-sm text-gray-500">
                                <div
                                    className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                                    <EventIcon type={item.event_type}/>
                                </div>
                                <div className="flex-1 flex items-center justify-between flex-wrap gap-1">
                                    <span><EventDescription event={item}/></span>
                                    <span className="text-xs text-gray-400">{formatTime(item.created_at)}</span>
                                </div>
                            </div>
                        )
                    ))
                )}
                <div ref={bottomRef}/>
            </div>

            {/* Comment input */}
            {canComment ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="comment" className="sr-only">Add a comment</label>
                        <textarea
                            id="comment"
                            placeholder="Add a comment..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            disabled={submitting}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                    </div>
                    {error && (
                        <p role="alert" className="text-xs text-red-500">{error}</p>
                    )}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !content.trim()}
                            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition text-sm font-medium disabled:opacity-50"
                        >
                            {submitting ? "Posting..." : "Post Comment"}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                    Viewers cannot post comments.
                </p>
            )}
        </div>
    );
}