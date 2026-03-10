"use client";

import {use, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

interface PageProps {
    params: Promise<{ token: string }>;
}

interface InviteInfo {
    org_name: string;
    invited_by_email: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
}

export default function InvitePage({params}: PageProps) {
    const {token} = use(params);
    const router = useRouter();

    const [invite, setInvite] = useState<InviteInfo | null>(null);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [acceptError, setAcceptError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/invites/info?token=${token}`);
                const data = await res.json() as InviteInfo & { error?: string };
                if (!res.ok) {
                    setLoadError(data.error ?? 'Invalid invite');
                } else {
                    setInvite(data);
                }
            } catch {
                setLoadError('Failed to load invite');
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [token]);

    async function handleAccept() {
        setAccepting(true);
        setAcceptError("");
        try {
            const res = await fetch('/api/invites/redeem', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({token}),
            });
            const data = await res.json() as { success?: boolean; error?: string; orgId?: string };

            if (res.ok && data.success) {
                setAccepted(true);
                // Switch to the new org and redirect
                await fetch('/api/orgs/switch', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({orgId: data.orgId}),
                });
                setTimeout(() => router.push('/'), 1500);
            } else if (res.status === 401) {
                // Not logged in — send to login with redirect back
                router.push(`/login?redirect=/invite/${token}`);
            } else {
                setAcceptError(data.error ?? 'Failed to accept invite');
            }
        } catch {
            setAcceptError('Something went wrong');
        } finally {
            setAccepting(false);
        }
    }

    const isExpired = invite && new Date(invite.expires_at) < new Date();
    const isUsed = invite?.accepted_at != null;

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center p-6">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div
                        className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">BO
                    </div>
                    <span className="text-2xl font-bold text-gray-900">BlackOps Pro</span>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl p-8">

                    {loading ? (
                        <div className="text-center py-8">
                            <div
                                className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-black animate-spin mx-auto mb-4"/>
                            <p className="text-gray-500 text-sm">Loading invite...</p>
                        </div>

                    ) : loadError ? (
                        <div className="text-center py-6">
                            <p className="text-4xl mb-4">🚫</p>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Invite</h2>
                            <p className="text-gray-500 text-sm mb-6">{loadError}</p>
                            <Link href="/" className="text-sm text-black underline">Go to Dashboard</Link>
                        </div>

                    ) : isUsed ? (
                        <div className="text-center py-6">
                            <p className="text-4xl mb-4">✅</p>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Already Used</h2>
                            <p className="text-gray-500 text-sm mb-6">This invite has already been accepted.</p>
                            <Link href="/" className="text-sm text-black underline">Go to Dashboard</Link>
                        </div>

                    ) : isExpired ? (
                        <div className="text-center py-6">
                            <p className="text-4xl mb-4">⏰</p>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Invite Expired</h2>
                            <p className="text-gray-500 text-sm mb-6">This invite expired
                                on {new Date(invite!.expires_at).toLocaleDateString()}. Ask an admin to send a new
                                one.</p>
                            <Link href="/" className="text-sm text-black underline">Go to Dashboard</Link>
                        </div>

                    ) : accepted ? (
                        <div className="text-center py-6">
                            <p className="text-4xl mb-4">🎉</p>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Welcome aboard!</h2>
                            <p className="text-gray-500 text-sm">You've joined <strong>{invite!.org_name}</strong>.
                                Redirecting...</p>
                        </div>

                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <p className="text-4xl mb-4">✉️</p>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">You're invited!</h2>
                                <p className="text-gray-500 text-sm">
                                    <strong>{invite!.invited_by_email}</strong> has invited you to join
                                </p>
                            </div>

                            {/* Invite details */}
                            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Organization</span>
                                    <span className="text-sm font-semibold text-gray-900">{invite!.org_name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Role</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                                        invite!.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                            invite!.role === 'member' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-600'
                                    }`}>{invite!.role}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expires</span>
                                    <span
                                        className="text-sm text-gray-600">{new Date(invite!.expires_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {acceptError && (
                                <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                    {acceptError}
                                    {acceptError.includes('log in') && (
                                        <Link href={`/login?redirect=/invite/${token}`}
                                              className="ml-2 underline font-medium">Log in</Link>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => void handleAccept()}
                                disabled={accepting}
                                className="w-full bg-black text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50"
                            >
                                {accepting ? 'Accepting...' : `Join ${invite!.org_name}`}
                            </button>

                            <p className="text-center text-xs text-gray-400 mt-4">
                                Don't have an account?{' '}
                                <Link href={`/signup?redirect=/invite/${token}`}
                                      className="text-black underline font-medium">Sign up first</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}