import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {getTicketById, updateTicket, isValidStatusTransition} from '@/lib/tickets';
import {TicketStatus} from '@/types/ticket';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId} = await requireOrg();

        const ticket = await getTicketById(id, orgId);
        if (!ticket) {
            return NextResponse.json({error: 'Ticket not found'}, {status: 404});
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('GET /api/tickets/[id] error:', error);
        return NextResponse.json({error: 'Failed to fetch ticket'}, {status: 500});
    }
}

export async function PATCH(req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId, role, user} = await requireOrg();

        if (role === 'viewer') {
            return NextResponse.json(
                {error: 'Viewers cannot edit tickets'},
                {status: 403}
            );
        }

        const body = await req.json() as {
            title?: string;
            description?: string;
            severity?: number;
            status?: string;
            assignee_id?: string | null;
            tags?: string[];
        };

        const {title, description, severity, status, assignee_id, tags} = body;

        // Validate status transition if status is being changed
        if (status) {
            const existing = await getTicketById(id, orgId);
            if (!existing) {
                return NextResponse.json({error: 'Ticket not found'}, {status: 404});
            }

            const validStatuses: TicketStatus[] = ['open', 'investigating', 'mitigated', 'resolved'];
            if (!validStatuses.includes(status as TicketStatus)) {
                return NextResponse.json({error: 'Invalid status value'}, {status: 400});
            }

            if (!isValidStatusTransition(existing.status, status as TicketStatus)) {
                return NextResponse.json(
                    {error: `Cannot transition from "${existing.status}" to "${status}"`},
                    {status: 400}
                );
            }
        }

        if (severity !== undefined && (severity < 1 || severity > 5)) {
            return NextResponse.json(
                {error: 'Severity must be between 1 and 5'},
                {status: 400}
            );
        }

        const ticket = await updateTicket(id, orgId, {
            title,
            description,
            severity,
            status: status as TicketStatus | undefined,
            assignee_id,
            tags,
        });

        if (!ticket) {
            return NextResponse.json({error: 'Ticket not found'}, {status: 404});
        }

        console.log(`[tickets] Updated ticket ${id} by user ${user.userId} in org ${orgId}`);

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('PATCH /api/tickets/[id] error:', error);
        return NextResponse.json({error: 'Failed to update ticket'}, {status: 500});
    }
}