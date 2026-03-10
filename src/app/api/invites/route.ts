import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {createInvite, getOrgInvites} from '@/lib/invites';
import {writeAudit} from '@/lib/audit';

export async function GET() {
    try {
        const {orgId, role} = await requireOrg();

        if (role !== 'admin' && role !== 'owner') {
            return NextResponse.json({error: 'Only admins and owners can view invites'}, {status: 403});
        }

        const invites = await getOrgInvites(orgId);
        return NextResponse.json(invites);
    } catch (error) {
        console.error('GET /api/invites error:', error);
        return NextResponse.json({error: 'Failed to fetch invites'}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const {orgId, role, user} = await requireOrg();

        if (role !== 'admin' && role !== 'owner') {
            return NextResponse.json({error: 'Only admins and owners can create invites'}, {status: 403});
        }

        const body = await req.json() as { email?: string; role?: string };
        const inviteRole = body.role ?? 'member';
        const validRoles = ['admin', 'member', 'viewer'];

        if (!validRoles.includes(inviteRole)) {
            return NextResponse.json({error: 'Invalid role'}, {status: 400});
        }

        // Only owners can invite admins
        if (inviteRole === 'admin' && role !== 'owner') {
            return NextResponse.json({error: 'Only owners can invite admins'}, {status: 403});
        }

        const invite = await createInvite(orgId, user.userId, {
            email: body.email || undefined,
            role: inviteRole as 'admin' | 'member' | 'viewer',
        });

        await writeAudit({
            orgId,
            actorId: user.userId,
            action: 'org.member_invited',
            entityType: 'organization',
            entityId: orgId,
            newData: {email: body.email ?? 'open invite', role: inviteRole},
        });

        console.log(`[invites] Created invite for org ${orgId} by ${user.userId}`);
        return NextResponse.json(invite, {status: 201});
    } catch (error) {
        console.error('POST /api/invites error:', error);
        return NextResponse.json({error: 'Failed to create invite'}, {status: 500});
    }
}