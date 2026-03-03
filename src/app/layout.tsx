import type {Metadata} from "next";
import React from "react";
import "./global.css";

export const metadata: Metadata = {
    title: "BlackOps Pro",
    description: "Multi-tenant Realtime Ops",
};

export default function RootLayout({children}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}