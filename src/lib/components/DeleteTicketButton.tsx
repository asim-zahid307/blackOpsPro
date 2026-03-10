"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

interface Props {
    ticketId: string;
}

export default function DeleteTicketButton({ticketId}: Props) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: "DELETE",
            });

            const data = await res.json() as { error?: string };

            if (res.ok) {
                router.push("/tickets");
                router.refresh();
            } else {
                setError(data.error ?? "Failed to delete ticket");
                setConfirming(false);
            }
        } catch (err: unknown) {
            setError((err as Error).message);
            setConfirming(false);
        } finally {
            setLoading(false);
        }
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Are you sure?</span>
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-60"
                >
                    {loading ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-white transition text-sm font-medium"
                >
                    Cancel
                </button>
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition text-sm font-medium"
        >
            Delete
        </button>
    );
}