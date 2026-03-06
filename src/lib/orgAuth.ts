import {queryOne} from "@/lib/db";

export type OrgRole = "admin" | "member" | "viewer";

interface UserOrg {
    role: OrgRole;
}

/**
 * Get user's role inside an organization
 */
export async function getUserOrgRole(
    userId: string,
    orgId: string
): Promise<OrgRole | null> {

    const result = await queryOne<UserOrg>(
        `
            SELECT role
            FROM user_organizations
            WHERE user_id = $1
              AND org_id = $2
        `,
        [userId, orgId]
    );

    return result?.role ?? null;
}


/**
 * Require a minimum role to access something
 */
export async function requireOrgRole(
    userId: string,
    orgId: string,
    required: OrgRole
) {

    const role = await getUserOrgRole(userId, orgId);

    if (!role) {
        throw new Error("User does not belong to this organization");
    }

    const hierarchy: Record<OrgRole, number> = {
        viewer: 1,
        member: 2,
        admin: 3,
    };

    if (hierarchy[role] < hierarchy[required]) {
        throw new Error("Insufficient permissions");
    }

    return role;
}


/**
 * Check if user is admin
 */
export async function isOrgAdmin(userId: string, orgId: string) {
    const role = await getUserOrgRole(userId, orgId);
    return role === "admin";
}