"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            return;
        }

        router.push("/org");
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
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                    />

                    {errorMsg && (
                        <p className="text-sm text-red-500 text-center">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 py-3 text-white font-medium tracking-wide transition hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                    >
                        Login
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