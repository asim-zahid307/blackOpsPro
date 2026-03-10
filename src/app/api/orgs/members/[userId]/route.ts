import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {query, queryOne} from '@/lib/db';
import {writeAudit} from '@/lib/audit';

interface RouteParams {
    params: Promise<{ userId: string }>;
}

export async function PATCH(req: NextRequest, {params}: RouteParams) {
    try {
        const {userId: targetUserId} = await params;
        const {orgId, role, user} = await requireOrg();

        // Only admin and owner can change roles
        if (role !== 'admin' && role !== 'owner') {
            return NextResponse.json(
                {error: 'Only admins and owners can change member roles'},
                {status: 403}
            );
        }

        const body = await req.json() as { role?: string };
        const newRole = body.role;

        const validRoles = ['admin', 'member', 'viewer'];
        if (!newRole || !validRoles.includes(newRole)) {
            return NextResponse.json(
                {error: 'Role must be one of: admin, member, viewer'},
                {status: 400}
            );
        }

        // Cannot change your own role
        if (targetUserId === user.userId) {
            return NextResponse.json(
                {error: 'You cannot change your own role'},
                {status: 400}
            );
        }

        // Cannot change an owner's role (owners are protected)
        const targetMembership = await queryOne<{ role: string }>(
            `SELECT role
             FROM user_organizations
             WHERE user_id = $1
               AND org_id = $2`,
            [targetUserId, orgId]
        );

        if (!targetMembership) {
            return NextResponse.json(
                {error: 'User is not a member of this organization'},
                {status: 404}
            );
        }

        if (targetMembership.role === 'owner') {
            return NextResponse.json(
                {error: 'Cannot change the role of an owner'},
                {status: 403}
            );
        }

        // Admins cannot promote others to admin (only owner can)
        if (role === 'admin' && newRole === 'admin') {
            return NextResponse.json(
                {error: 'Only owners can promote members to admin'},
                {status: 403}
            );
        }

        await query(
            `UPDATE user_organizations
             SET role = $1
             WHERE user_id = $2
               AND org_id = $3`,
            [newRole, targetUserId, orgId]
        );

        await writeAudit({
            orgId,
            actorId: user.userId,
            action: 'org.role_changed',
            entityType: 'user',
            entityId: targetUserId,
            oldData: {role: targetMembership.role},
            newData: {role: newRole},
        });

        console.log(`[org] Role changed for ${targetUserId} to ${newRole} by ${user.userId}`);
        return NextResponse.json({success: true, role: newRole});
    } catch (error) {
        console.error('PATCH /api/orgs/members/[userId] error:', error);
        return NextResponse.json({error: 'Failed to update role'}, {status: 500});
    }
}