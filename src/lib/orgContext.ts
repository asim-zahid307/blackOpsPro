import {cookies} from "next/headers";
import {queryOne} from "@/lib/db";
import {requireAuth} from "@/lib/auth";
import {UserOrganization} from "@/types/org";

const ORG_COOKIE = "current_org_id";

export async function setCurrentOrg(orgId: string) {
    const cookieStore = await cookies();
    cookieStore.set(ORG_COOKIE, orgId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });
}

export async function getCurrentOrg(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(ORG_COOKIE)?.value ?? null;
}

export async function requireOrg() {
    const user = await requireAuth();
    const orgId = await getCurrentOrg();

    // If no org cookie, auto-select the user's first org (read-only, no cookie write)
    let resolvedOrgId = orgId;

    if (!resolvedOrgId) {
        const firstOrg = await queryOne<{ org_id: string }>(
            `SELECT org_id
             FROM user_organizations
             WHERE user_id = $1
             ORDER BY created_at ASC LIMIT 1`,
            [user.userId]
        );

        if (!firstOrg) {
            throw new Error("User does not belong to any organization");
        }

        resolvedOrgId = firstOrg.org_id;
        // NOTE: We do NOT set the cookie here — cookies can only be written
        // in Route Handlers or Server Actions, not Server Components.
        // The cookie gets set properly on login/signup.
    }

    // Verify user is actually a member of this org
    const membership = await queryOne<UserOrganization>(
        `SELECT role
         FROM user_organizations
         WHERE user_id = $1
           AND org_id = $2`,
        [user.userId, resolvedOrgId]
    );

    if (!membership) {
        throw new Error("Access denied to this organization");
    }

    return {
        orgId: resolvedOrgId,
        role: membership.role,
        user,
    };
}