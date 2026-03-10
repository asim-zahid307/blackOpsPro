import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {createComment, getComments} from '@/lib/timeline';
import {writeAudit} from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId} = await requireOrg();
        const comments = await getComments(id, orgId);
        return NextResponse.json(comments);
    } catch (error) {
        console.error('GET /api/tickets/[id]/comments error:', error);
        return NextResponse.json({error: 'Failed to fetch comments'}, {status: 500});
    }
}

export async function POST(req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId, role, user} = await requireOrg();

        if (role === 'viewer') {
            return NextResponse.json({error: 'Viewers cannot comment'}, {status: 403});
        }

        const body = await req.json() as { content?: string };
        const {content} = body;

        if (!content || content.trim() === '') {
            return NextResponse.json({error: 'Comment content is required'}, {status: 400});
        }
        if (content.trim().length > 5000) {
            return NextResponse.json({error: 'Comment is too long (max 5000 chars)'}, {status: 400});
        }

        const comment = await createComment(id, orgId, user.userId, content.trim());

        await writeAudit({
            orgId,
            actorId: user.userId,
            action: 'comment.created',
            entityType: 'comment',
            entityId: comment.id,
            newData: {ticket_id: id, content: content.trim().slice(0, 100)},
        });

        console.log(`[comments] New comment on ticket ${id} by ${user.userId}`);
        return NextResponse.json(comment, {status: 201});
    } catch (error) {
        console.error('POST /api/tickets/[id]/comments error:', error);
        return NextResponse.json({error: 'Failed to post comment'}, {status: 500});
    }
}