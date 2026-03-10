// src/app/org/page.tsx
import {cookies} from "next/headers";
import {queryOne} from "@/lib/db";
import {requireAuth} from "@/lib/auth";
import LogoutButton from "@/lib/components/LogoutButton";
import Link from "next/link";

interface Organization {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export default async function OrgPage() {
    const user = await requireAuth();

    // Read current org from cookie
    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("current_org_id")?.value;

    // If no org selected yet, we can pick first org for this user
    const org = currentOrgId
        ? await queryOne<Organization>(
            `
                SELECT o.*
                FROM organizations o
                         JOIN user_organizations uo ON uo.org_id = o.id
                WHERE uo.user_id = $1
                  AND o.id = $2
            `,
            [user.userId, currentOrgId]
        )
        : await queryOne<Organization>(
            `
                SELECT o.*
                FROM organizations o
                         JOIN user_organizations uo ON uo.org_id = o.id
                WHERE uo.user_id = $1
                ORDER BY o.name LIMIT 1
            `,
            [user.userId]
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
            {/* HEADER */}
            <header className="sticky top-0 backdrop-blur-xl bg-white/40 border-b border-white/30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                            BO
                        </div>
                        <span className="text-lg font-semibold">BlackOps Pro</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm hidden sm:block">{user.email}</span>
                        <Link
                            href="/"
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 inline-block text-center"
                        >
                            Dashboard
                        </Link>
                        <LogoutButton/>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {org ? (
                    <>
                        <h1 className="text-3xl font-bold mb-2">
                            Organization: <span className="text-blue-600">{org.name}</span>
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Details of the organization you belong to.
                        </p>

                        <div className="rounded-2xl p-8 border bg-white/40 backdrop-blur-xl shadow-lg text-center">
                            <div
                                className="h-12 w-12 mx-auto rounded-xl bg-black text-white flex items-center justify-center font-semibold mb-4">
                                ORG
                            </div>
                            <p className="text-sm text-gray-600">Organization ID: {org.id}</p>
                        </div>
                    </>
                ) : (
                    <p>No organization assigned or access denied.</p>
                )}
            </main>
        </div>
    );
}