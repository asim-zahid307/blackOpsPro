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
    const [orgsLoading, setOrgsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/orgs")
            .then(res => res.json())
            .then(data => {
                setOrgs(data);
                setOrgsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setOrgsLoading(false);
            });
    }, []);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedOrg) return setError("Please select an organization");

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password, orgId: selectedOrg}),
            });

            const data = await res.json();

            if (res.ok) {
                // Redirect to dashboard (not login) after successful signup
                router.push("/");
            } else {
                setError(data.error || "Signup failed");
            }
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
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-sm text-gray-600 mt-1">Join your workspace</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">

                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="org" className="sr-only">Organization</label>
                        <select
                            id="org"
                            value={selectedOrg}
                            onChange={e => setSelectedOrg(e.target.value)}
                            required
                            disabled={loading || orgsLoading}
                            className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="">
                                {orgsLoading ? "Loading organizations..." : "Select Organization"}
                            </option>
                            {orgs.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-500">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || orgsLoading}
                        className="w-full rounded-lg bg-black text-white py-2 font-medium hover:bg-gray-800 transition disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Sign Up"}
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