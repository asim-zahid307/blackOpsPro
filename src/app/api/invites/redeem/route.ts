import {NextRequest, NextResponse} from 'next/server';
import {requireAuth} from '@/lib/auth';
import {redeemInvite} from '@/lib/invites';
import {writeAudit} from '@/lib/audit';
import {query} from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await req.json() as { token?: string };

        if (!body.token) {
            return NextResponse.json({error: 'Token is required'}, {status: 400});
        }

        const result = await redeemInvite(body.token, user.userId);

        if (!result.success) {
            return NextResponse.json({error: result.error}, {status: 400});
        }

        // Get org name for response
        const orgResult = await query(
            `SELECT name
             FROM organizations
             WHERE id = $1`,
            [result.orgId]
        );
        const orgName = (orgResult.rows[0] as { name: string })?.name ?? 'your organization';

        await writeAudit({
            orgId: result.orgId!,
            actorId: user.userId,
            action: 'org.member_invited',
            entityType: 'organization',
            entityId: result.orgId,
            newData: {user: user.email, role: result.role, action: 'accepted_invite'},
        });

        console.log(`[invites] Invite redeemed for org ${result.orgId} by ${user.userId}`);
        return NextResponse.json({success: true, orgId: result.orgId, orgName});
    } catch (error) {
        console.error('POST /api/invites/redeem error:', error);
        return NextResponse.json({error: 'Failed to redeem invite'}, {status: 500});
    }
}