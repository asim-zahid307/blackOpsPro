import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {revokeInvite} from '@/lib/invites';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId, role} = await requireOrg();

        if (role !== 'admin' && role !== 'owner') {
            return NextResponse.json({error: 'Only admins and owners can revoke invites'}, {status: 403});
        }

        const revoked = await revokeInvite(id, orgId);
        if (!revoked) {
            return NextResponse.json({error: 'Invite not found or already used'}, {status: 404});
        }

        return NextResponse.json({message: 'Invite revoked'});
    } catch (error) {
        console.error('DELETE /api/invites/[id] error:', error);
        return NextResponse.json({error: 'Failed to revoke invite'}, {status: 500});
    }
}