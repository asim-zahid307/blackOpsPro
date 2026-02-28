"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/browser";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const supabase = createClient();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");

        const {error} = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            return;
        }

        // Redirect to login page after signup
        router.push("/login");
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded">
            <h1 className="text-2xl mb-4">Signup</h1>
            <form onSubmit={handleSignup} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                />
                {errorMsg && <p className="text-red-500">{errorMsg}</p>}
                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
                    Signup
                </button>
            </form>
            <p className="mt-4 text-center">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 underline">
                    Login here
                </a>
            </p>
        </div>
    );
}