"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Org {
    id: string;
    name: string;
}

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/orgs")
            .then(res => res.json())
            .then(data => setOrgs(data))
            .catch(err => console.error(err));
    }, []);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedOrg) return setError("Select an organization");

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, orgId: selectedOrg }),
            });

            const data = await res.json();
            if (res.ok) router.push("/login");
            else setError(data.error);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-6">
            <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-center mb-4">Create Account</h1>
                <form onSubmit={handleSignup} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border px-4 py-2"/>
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-lg border px-4 py-2"/>

                    <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} required className="w-full rounded-lg border px-4 py-2">
                        <option value="">Select Organization</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>

                    {error && <p className="text-red-500">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-black text-white py-2 rounded-lg">
                        {loading ? "Creating..." : "Signup"}
                    </button>
                </form>
            </div>
        </div>
    );
}