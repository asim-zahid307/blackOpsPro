import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {getTimeline} from '@/lib/timeline';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId} = await requireOrg();
        const timeline = await getTimeline(id, orgId);
        return NextResponse.json(timeline);
    } catch (error) {
        console.error('GET /api/tickets/[id]/timeline error:', error);
        return NextResponse.json({error: 'Failed to fetch timeline'}, {status: 500});
    }
}