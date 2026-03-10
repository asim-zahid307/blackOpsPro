import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {getTickets, createTicket} from '@/lib/tickets';

export async function GET() {
    try {
        const {orgId} = await requireOrg();
        const tickets = await getTickets(orgId);
        return NextResponse.json(tickets);
    } catch (error) {
        console.error('GET /api/tickets error:', error);
        return NextResponse.json({error: 'Failed to fetch tickets'}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const {orgId, role, user} = await requireOrg();

        if (role === 'viewer') {
            return NextResponse.json(
                {error: 'Viewers cannot create tickets'},
                {status: 403}
            );
        }

        const body = await req.json() as {
            title?: string;
            description?: string;
            severity?: number;
            assignee_id?: string;
            tags?: string[];
        };

        const {title, description, severity, assignee_id, tags} = body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return NextResponse.json({error: 'Title is required'}, {status: 400});
        }

        if (!severity || typeof severity !== 'number' || severity < 1 || severity > 5) {
            return NextResponse.json(
                {error: 'Severity must be a number between 1 and 5'},
                {status: 400}
            );
        }

        const ticket = await createTicket(orgId, user.userId, {
            title: title.trim(),
            description,
            severity,
            assignee_id,
            tags,
        });

        console.log(`[tickets] Created ticket ${ticket.id} by user ${user.userId} in org ${orgId}`);

        return NextResponse.json(ticket, {status: 201});
    } catch (error) {
        console.error('POST /api/tickets error:', error);
        return NextResponse.json({error: 'Failed to create ticket'}, {status: 500});
    }
}