import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {createTicket} from '@/lib/tickets';
import {searchTickets} from '@/lib/ticketSearch';
import {writeAudit} from '@/lib/audit';
import {TicketStatus} from '@/types/ticket';

export async function GET(req: NextRequest) {
    try {
        const {orgId} = await requireOrg();
        const {searchParams} = new URL(req.url);

        const filters = {
            search: searchParams.get('search') ?? undefined,
            status: searchParams.get('status') as TicketStatus | undefined,
            severity: searchParams.get('severity') ? Number(searchParams.get('severity')) : undefined,
            assignee_id: searchParams.get('assignee_id') ?? undefined,
            tag: searchParams.get('tag') ?? undefined,
            date_from: searchParams.get('date_from') ?? undefined,
            date_to: searchParams.get('date_to') ?? undefined,
        };

        const cursor = searchParams.get('cursor') ?? undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

        const result = await searchTickets(orgId, filters, {cursor, limit});
        return NextResponse.json(result);
    } catch (error) {
        console.error('GET /api/tickets error:', error);
        return NextResponse.json({error: 'Failed to fetch tickets'}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const {orgId, role, user} = await requireOrg();

        if (role === 'viewer') {
            return NextResponse.json({error: 'Viewers cannot create tickets'}, {status: 403});
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
            return NextResponse.json({error: 'Severity must be between 1 and 5'}, {status: 400});
        }

        const ticket = await createTicket(orgId, user.userId, {
            title: title.trim(), description, severity, assignee_id, tags,
        });

        await writeAudit({
            orgId,
            actorId: user.userId,
            action: 'ticket.created',
            entityType: 'ticket',
            entityId: ticket.id,
            newData: {title: ticket.title, severity: ticket.severity, status: ticket.status},
        });

        console.log(`[tickets] Created ticket ${ticket.id} by ${user.userId}`);
        return NextResponse.json(ticket, {status: 201});
    } catch (error) {
        console.error('POST /api/tickets error:', error);
        return NextResponse.json({error: 'Failed to create ticket'}, {status: 500});
    }
}