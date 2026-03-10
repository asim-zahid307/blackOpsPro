import {query, queryOne} from './db';
import {Invite, CreateInviteInput} from '@/types/invite';
import crypto from 'crypto';

function generateToken(): string {
    return crypto.randomBytes(48).toString('hex');
}

export async function createInvite(
    orgId: string,
    invitedBy: string,
    input: CreateInviteInput
): Promise<Invite> {
    const token = generateToken();
    // Expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await query(
        `INSERT INTO invites (org_id, invited_by, email, role, token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [orgId, invitedBy, input.email ?? null, input.role, token, expiresAt]
    );

    return getInviteByToken(token) as Promise<Invite>;
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
    return queryOne<Invite>(
        `SELECT i.*,
                o.name  AS org_name,
                u.email AS invited_by_email
         FROM invites i
         JOIN organizations o ON o.id = i.org_id
         JOIN users u          ON u.id = i.invited_by
         WHERE i.token = $1`,
        [token]
    );
}

export async function getOrgInvites(orgId: string): Promise<Invite[]> {
    const result = await query(
        `SELECT i.*,
                o.name  AS org_name,
                u.email AS invited_by_email
         FROM invites i
         JOIN organizations o ON o.id = i.org_id
         JOIN users u          ON u.id = i.invited_by
         WHERE i.org_id = $1
         ORDER BY i.created_at DESC
         LIMIT 20`,
        [orgId]
    );
    return result.rows as Invite[];
}

export async function redeemInvite(
    token: string,
    userId: string
): Promise<{ success: boolean; error?: string; orgId?: string; role?: string }> {
    const invite = await getInviteByToken(token);

    if (!invite) {
        return {success: false, error: 'Invite not found or already used'};
    }
    if (invite.accepted_at) {
        return {success: false, error: 'This invite has already been used'};
    }
    if (new Date(invite.expires_at) < new Date()) {
        return {success: false, error: 'This invite has expired'};
    }

    // Check if user is already a member
    const existing = await queryOne<{ id: string }>(
        `SELECT user_id AS id FROM user_organizations
         WHERE user_id = $1 AND org_id = $2`,
        [userId, invite.org_id]
    );

    if (existing) {
        // Already a member — mark invite used and redirect
        await query(
            `UPDATE invites SET accepted_at = NOW() WHERE token = $1`,
            [token]
        );
        return {success: true, orgId: invite.org_id, role: invite.role};
    }

    // Add user to org
    await query(
        `INSERT INTO user_organizations (user_id, org_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, org_id) DO NOTHING`,
        [userId, invite.org_id, invite.role]
    );

    // Mark invite as accepted
    await query(
        `UPDATE invites
         SET accepted_at = NOW()
         WHERE token = $1`,
        [token]
    );

    return {success: true, orgId: invite.org_id, role: invite.role};
}

export async function revokeInvite(inviteId: string, orgId: string): Promise<boolean> {
    const result = await query(
        `DELETE FROM invites WHERE id = $1 AND org_id = $2 AND accepted_at IS NULL
         RETURNING id`,
        [inviteId, orgId]
    );
    return result.rows.length > 0;
}