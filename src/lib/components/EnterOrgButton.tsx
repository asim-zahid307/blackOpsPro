// src/components/EnterOrgButton.tsx
"use client";

import { useState } from "react";

interface Props {
    orgId: string;
    orgName: string;
}

export default function EnterOrgButton({ orgId, orgName }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/orgs/switch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to enter organization");
                return;
            }

            // Optionally refresh the page or redirect to /org
            window.location.href = "/org";
        } catch (err: any) {
            console.error(err);
            setError("Unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={handleClick}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            >
                {loading ? "Entering..." : `Enter ${orgName}`}
            </button>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}