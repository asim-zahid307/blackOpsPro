"use client";

import {useState, useEffect} from "react";
import {Invite} from "@/types/invite";

interface Props {
    currentUserRole: string;
}

export default function InviteManager({currentUserRole}: Props) {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // New invite form
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");

    async function loadInvites() {
        try {
            const res = await fetch('/api/invites');
            const data = await res.json() as Invite[] | { error: string };
            if (!('error' in data)) setInvites(data);
        } catch { /* silent */
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadInvites();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setError("");
        try {
            const res = await fetch('/api/invites', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: email.trim() || undefined, role}),
            });
            const data = await res.json() as Invite & { error?: string };
            if (res.ok) {
                setInvites(prev => [data, ...prev]);
                setEmail("");
                setRole("member");
                setShowForm(false);
            } else {
                setError(data.error ?? 'Failed to create invite');
            }
        } catch {
            setError('Something went wrong');
        } finally {
            setCreating(false);
        }
    }

    async function handleRevoke(inviteId: string) {
        try {
            const res = await fetch(`/api/invites/${inviteId}`, {method: 'DELETE'});
            if (res.ok) {
                setInvites(prev => prev.filter(i => i.id !== inviteId));
            }
        } catch { /* silent */
        }
    }

    function copyLink(invite: Invite) {
        const url = `${window.location.origin}/invite/${invite.token}`;
        void navigator.clipboard.writeText(url);
        setCopiedId(invite.id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    const isExpired = (invite: Invite) => new Date(invite.expires_at) < new Date();

    return (
        <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">Invite Members</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Generate invite links to add people to your org</p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(f => !f);
                        setError("");
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
                >
                    {showForm ? 'Cancel' : '+ New Invite'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <form onSubmit={e => void handleCreate(e)} className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Email
                                (optional)</label>
                            <input
                                type="email"
                                placeholder="person@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black transition hover:border-gray-400"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label
                                className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Role</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-black transition hover:border-gray-400"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="member">Member</option>
                                {currentUserRole === 'owner' && <option value="admin">Admin</option>}
                            </select>
                        </div>
                        {error && <p className="w-full text-xs text-red-500">{error}</p>}
                        <button
                            type="submit"
                            disabled={creating}
                            className="h-10 px-5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Generate Link'}
                        </button>
                    </form>
                    <p className="text-xs text-gray-400 mt-2">
                        Leave email blank to create an open invite anyone can use. Links expire in 7 days.
                    </p>
                </div>
            )}

            {/* Invite list */}
            <div className="divide-y divide-gray-100">
                {loading ? (
                    <div className="px-6 py-8 text-center text-sm text-gray-400">Loading invites...</div>
                ) : invites.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                        <p className="text-sm text-gray-400">No invites yet. Create one to get started.</p>
                    </div>
                ) : (
                    invites.map(invite => {
                        const expired = isExpired(invite);
                        const used = !!invite.accepted_at;
                        const active = !expired && !used;

                        return (
                            <div key={invite.id} className="px-6 py-4 flex items-center gap-4">
                                {/* Status dot */}
                                <div
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${used ? 'bg-green-400' : expired ? 'bg-red-400' : 'bg-blue-400'}`}/>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {invite.email ?? 'Open invite'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                            invite.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                invite.role === 'member' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                            {invite.role}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            used ? 'bg-green-100 text-green-700' :
                                                expired ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-700'
                                        }`}>
                                            {used ? 'Accepted' : expired ? 'Expired' : 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Created by {invite.invited_by_email} ·{' '}
                                        {used
                                            ? `Accepted ${new Date(invite.accepted_at!).toLocaleDateString()}`
                                            : expired
                                                ? `Expired ${new Date(invite.expires_at).toLocaleDateString()}`
                                                : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`
                                        }
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {active && (
                                        <button
                                            onClick={() => copyLink(invite)}
                                            className={`h-8 px-3 rounded-lg border text-xs font-medium transition ${
                                                copiedId === invite.id
                                                    ? 'border-green-300 bg-green-50 text-green-600'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                                            }`}
                                        >
                                            {copiedId === invite.id ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    )}
                                    {!used && (
                                        <button
                                            onClick={() => void handleRevoke(invite.id)}
                                            className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}