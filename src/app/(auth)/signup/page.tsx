"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, password}),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || "Signup failed");
                return;
            }

            router.push("/login");
        } catch (error) {
            setErrorMsg("An error occurred. Please try again.");
            console.error(error);
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
                        Create Account
                    </h1>

                    <p className="text-sm text-gray-600 mt-1">
                        Join BlackOps Pro
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">

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
                        {isLoading ? "Creating account..." : "Signup"}
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