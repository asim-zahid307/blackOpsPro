"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password}),
            });

            const data = await response.json();

            if (response.ok) {
                router.push("/org");
            } else {
                setErrorMsg(data.error);
            }
        } catch (error: unknown) {
            setErrorMsg((error as Error).message);
        } finally {
            setIsLoading(false);
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
                        BlackOps Pro Login
                    </h1>

                    <p className="text-sm text-gray-600 mt-1">
                        Access your workspace
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    {errorMsg && (
                        <p className="text-sm text-red-500">
                            {errorMsg}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-black text-white py-2 font-medium hover:bg-gray-800 transition disabled:opacity-60"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <a href="/signup" className="text-black font-medium underline">
                        Sign up here
                    </a>
                </p>

            </div>

        </div>
    );
}