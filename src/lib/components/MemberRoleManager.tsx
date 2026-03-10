"use client";

import {useState} from "react";
import {OrgMember} from "@/types/ticket";

interface Props {
    members: OrgMember[];
    currentUserId: string;
    currentUserRole: string;
}

const ROLE_STYLES: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-600',
};

export default function MemberRoleManager({members, currentUserId, currentUserRole}: Props) {
    const [memberList, setMemberList] = useState<OrgMember[]>(members);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const canManage = currentUserRole === 'admin' || currentUserRole === 'owner';

    async function handleRoleChange(targetUserId: string, newRole: string) {
        setError("");
        setSuccess("");
        setLoadingId(targetUserId);

        try {
            const res = await fetch(`/api/orgs/members/${targetUserId}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({role: newRole}),
            });

            const data = await res.json() as { role?: string; error?: string };

            if (res.ok && data.role) {
                setMemberList(prev =>
                    prev.map(m =>
                        m.user_id === targetUserId ? {...m, role: data.role!} : m
                    )
                );
                setSuccess(`Role updated successfully`);
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(data.error ?? "Failed to update role");
            }
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoadingId(null);
        }
    }

    return (
        <div className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Members</h2>
            <p className="text-sm text-gray-500 mb-5">
                {canManage
                    ? "Manage member roles within this organization."
                    : "Members of this organization."}
            </p>

            {error && (
                <div className="mb-4 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg text-sm">
                    ✓ {success}
                </div>
            )}

            <div className="space-y-3">
                {memberList.map(member => {
                    const isCurrentUser = member.user_id === currentUserId;
                    const isOwner = member.role === 'owner';
                    const canEdit = canManage && !isCurrentUser && !isOwner;

                    return (
                        <div
                            key={member.user_id}
                            className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    {member.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {member.email}
                                        {isCurrentUser && (
                                            <span className="ml-2 text-xs text-gray-400">(you)</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {canEdit ? (
                                    <select
                                        value={member.role}
                                        onChange={e => void handleRoleChange(member.user_id, e.target.value)}
                                        disabled={loadingId === member.user_id}
                                        className="text-xs rounded-lg border border-gray-200 bg-white/70 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="member">Member</option>
                                        {/* Only owners can set admin */}
                                        {currentUserRole === 'owner' && (
                                            <option value="admin">Admin</option>
                                        )}
                                    </select>
                                ) : (
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_STYLES[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {member.role}
                                    </span>
                                )}
                                {loadingId === member.user_id && (
                                    <span className="text-xs text-gray-400">Saving...</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}