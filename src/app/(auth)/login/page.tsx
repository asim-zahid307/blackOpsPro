"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || "Login failed");
                return;
            }

            router.push("/org");
        } catch (error) {
            setErrorMsg("An error occurred. Please try again.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
            <div className="w-full max-w-md p-8 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
                <h1 className="text-3xl font-semibold text-slate-900 text-center mb-2">
                    Welcome
                </h1>
                <p className="text-center text-slate-500 mb-6 text-sm">
                    Login to continue
                </p>

                <form onSubmit={handleLogin} className="space-y-5">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                    />

                    {errorMsg && (
                        <p className="text-sm text-red-500 text-center">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-3 text-white font-medium tracking-wide transition hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <a
                        href="/signup"
                        className="font-medium text-blue-600 hover:text-blue-700 transition"
                    >
                        Sign up here
                    </a>
                </p>
            </div>
        </div>
    );
}