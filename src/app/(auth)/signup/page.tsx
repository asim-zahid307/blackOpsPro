"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";

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
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password, orgId: selectedOrg}),
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
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-6">

            <div
                className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-xl p-8">

                <div className="text-center mb-6">
                    <div
                        className="mx-auto mb-4 h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                        BO
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Create Account
                    </h1>

                    <p className="text-sm text-gray-600 mt-1">
                        Join your workspace
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    <select
                        value={selectedOrg}
                        onChange={e => setSelectedOrg(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">Select Organization</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-black text-white py-2 font-medium hover:bg-gray-800 transition disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Signup"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <a href="/login" className="text-black font-medium underline">
                        Login here
                    </a>
                </p>
            </div>

        </div>
    );
}