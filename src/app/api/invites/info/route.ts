import {NextRequest, NextResponse} from 'next/server';
import {getInviteByToken} from '@/lib/invites';

export async function GET(req: NextRequest) {
    try {
        const {searchParams} = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({error: 'Token is required'}, {status: 400});
        }

        const invite = await getInviteByToken(token);

        if (!invite) {
            return NextResponse.json({error: 'Invite not found'}, {status: 404});
        }

        // Return only safe fields — not the full invite object
        return NextResponse.json({
            org_name: invite.org_name,
            invited_by_email: invite.invited_by_email,
            role: invite.role,
            expires_at: invite.expires_at,
            accepted_at: invite.accepted_at,
        });
    } catch (error) {
        console.error('GET /api/invites/info error:', error);
        return NextResponse.json({error: 'Failed to load invite'}, {status: 500});
    }
}