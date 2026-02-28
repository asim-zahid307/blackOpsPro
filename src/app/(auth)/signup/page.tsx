"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            router.push("/");
        }
    }

    return (
        <main style={{ maxWidth: 400, margin: "100px auto" }}>
            <h1>Sign Up</h1>

            <form onSubmit={handleSignup}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                </button>

                {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
        </main>
    );
}