import {NextRequest, NextResponse} from 'next/server';
import {requireOrg} from '@/lib/orgContext';
import {getTicketById, updateTicket, softDeleteTicket, isValidStatusTransition} from '@/lib/tickets';
import {writeAudit} from '@/lib/audit';
import {TicketStatus} from '@/types/ticket';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId} = await requireOrg();
        const ticket = await getTicketById(id, orgId);
        if (!ticket) return NextResponse.json({error: 'Ticket not found'}, {status: 404});
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
            return NextResponse.json({error: 'Viewers cannot edit tickets'}, {status: 403});
        }

        const existing = await getTicketById(id, orgId);
        if (!existing) return NextResponse.json({error: 'Ticket not found'}, {status: 404});

        const body = await req.json() as {
            title?: string;
            description?: string;
            severity?: number;
            status?: string;
            assignee_id?: string | null;
            tags?: string[];
        };

        const {title, description, severity, status, assignee_id, tags} = body;

        if (status) {
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
            return NextResponse.json({error: 'Severity must be between 1 and 5'}, {status: 400});
        }

        const ticket = await updateTicket(id, orgId, user.userId, {
            title, description, severity,
            status: status as TicketStatus | undefined,
            assignee_id, tags,
        });

        if (!ticket) return NextResponse.json({error: 'Ticket not found'}, {status: 404});

        // Build diff for audit
        const oldValues: Record<string, unknown> = {};
        const changes: Record<string, unknown> = {};
        if (title !== undefined && title !== existing.title) {
            oldValues.title = existing.title;
            changes.title = title;
        }
        if (status !== undefined && status !== existing.status) {
            oldValues.status = existing.status;
            changes.status = status;
        }
        if (severity !== undefined && severity !== existing.severity) {
            oldValues.severity = existing.severity;
            changes.severity = severity;
        }
        if ('assignee_id' in body && assignee_id !== existing.assignee_id) {
            oldValues.assignee_id = existing.assignee_id;
            changes.assignee_id = assignee_id;
        }

        await writeAudit({
            orgId,
            actorId: user.userId,
            action: status && status !== existing.status ? 'ticket.status_changed' : 'ticket.updated',
            entityType: 'ticket',
            entityId: id,
            oldData: oldValues,
            newData: changes,
        });

        console.log(`[tickets] Updated ticket ${id} by ${user.userId}`);
        return NextResponse.json(ticket);
    } catch (error) {
        console.error('PATCH /api/tickets/[id] error:', error);
        return NextResponse.json({error: 'Failed to update ticket'}, {status: 500});
    }
}

export async function DELETE(_req: NextRequest, {params}: RouteParams) {
    try {
        const {id} = await params;
        const {orgId, role, user} = await requireOrg();

        if (role !== 'owner' && role !== 'admin') {
            return NextResponse.json({error: 'Only admins and owners can delete tickets'}, {status: 403});
        }

        const existing = await getTicketById(id, orgId);
        if (!existing) return NextResponse.json({error: 'Ticket not found'}, {status: 404});

        const deleted = await softDeleteTicket(id, orgId);
        if (!deleted) return NextResponse.json({error: 'Ticket not found'}, {status: 404});

        await writeAudit({
            orgId,
            actorId: user.userId,
            action: 'ticket.deleted',
            entityType: 'ticket',
            entityId: id,
            oldData: {title: existing.title, status: existing.status},
        });

        console.log(`[tickets] Deleted ticket ${id} by ${user.userId}`);
        return NextResponse.json({message: 'Ticket deleted successfully'});
    } catch (error) {
        console.error('DELETE /api/tickets/[id] error:', error);
        return NextResponse.json({error: 'Failed to delete ticket'}, {status: 500});
    }
}