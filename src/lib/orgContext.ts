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

export async function getCurrentOrg() {
    const cookieStore = await cookies();
    const orgId = cookieStore.get(ORG_COOKIE)?.value;

    if (!orgId) return null;

    return orgId;
}

export async function requireOrg() {
    const user = await requireAuth();
    const orgId = await getCurrentOrg();

    if (!orgId) {
        throw new Error("Organization not selected");
    }

    const membership: UserOrganization | null = await queryOne(
        `
            SELECT role
            FROM user_organizations
            WHERE user_id = $1
              AND org_id = $2
        `,
        [user.userId, orgId]
    );

    if (!membership) {
        throw new Error("Access denied to this organization");
    }

    return {
        orgId,
        role: membership.role,
        user,
    };
}