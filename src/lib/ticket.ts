import {query, queryOne} from './db';
import {
    Ticket,
    Tag,
    TicketStatus,
    STATUS_TRANSITIONS,
    CreateTicketInput,
    UpdateTicketInput,
    OrgMember,
} from '@/types/ticket';

export function isValidStatusTransition(from: TicketStatus, to: TicketStatus): boolean {
    return STATUS_TRANSITIONS[from].includes(to);
}

const TICKET_SELECT = `
    SELECT t.*,
           u.email AS created_by_email,
           a.email AS assignee_email,
           COALESCE(
                   json_agg(
                           json_build_object('id', tg.id, 'name', tg.name, 'org_id', tg.org_id)
                   ) FILTER(WHERE tg.id IS NOT NULL),
                   '[]'
           )       AS tags
    FROM tickets t
             LEFT JOIN users u ON u.id = t.created_by
             LEFT JOIN users a ON a.id = t.assignee_id
             LEFT JOIN ticket_tags tt ON tt.ticket_id = t.id
             LEFT JOIN tags tg ON tg.id = tt.tag_id
`;

export async function getTickets(orgId: string): Promise<Ticket[]> {
    const result = await query(
        `${TICKET_SELECT}
         WHERE t.org_id = $1
         GROUP BY t.id, u.email, a.email
         ORDER BY t.updated_at DESC, t.id DESC`,
        [orgId]
    );
    return result.rows as Ticket[];
}

export async function getTicketById(id: string, orgId: string): Promise<Ticket | null> {
    return queryOne<Ticket>(
        `${TICKET_SELECT}
         WHERE t.id = $1 AND t.org_id = $2
         GROUP BY t.id, u.email, a.email`,
        [id, orgId]
    );
}

export async function createTicket(
    orgId: string,
    userId: string,
    input: CreateTicketInput
): Promise<Ticket> {
    const result = await query(
        `INSERT INTO tickets (org_id, title, description, severity, assignee_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
            orgId,
            input.title,
            input.description ?? null,
            input.severity,
            input.assignee_id ?? null,
            userId,
        ]
    );

    const ticket = result.rows[0] as Ticket;

    if (input.tags && input.tags.length > 0) {
        await syncTicketTags(ticket.id, orgId, input.tags);
    }

    // Return full ticket with joins
    return (await getTicketById(ticket.id, orgId)) as Ticket;
}

export async function updateTicket(
    id: string,
    orgId: string,
    input: UpdateTicketInput
): Promise<Ticket | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.title !== undefined) {
        fields.push(`title = $${idx++}`);
        values.push(input.title);
    }
    if (input.description !== undefined) {
        fields.push(`description = $${idx++}`);
        values.push(input.description);
    }
    if (input.severity !== undefined) {
        fields.push(`severity = $${idx++}`);
        values.push(input.severity);
    }
    if (input.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(input.status);
    }
    if ('assignee_id' in input) {
        fields.push(`assignee_id = $${idx++}`);
        values.push(input.assignee_id ?? null);
    }

    if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(id, orgId);
        await query(
            `UPDATE tickets
             SET ${fields.join(', ')}
             WHERE id = $${idx++}
               AND org_id = $${idx}`,
            values
        );
    }

    if (input.tags !== undefined) {
        await syncTicketTags(id, orgId, input.tags);
    }

    return getTicketById(id, orgId);
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
    const result = await query(
        `SELECT uo.user_id, u.email, uo.role
         FROM user_organizations uo
                  JOIN users u ON u.id = uo.user_id
         WHERE uo.org_id = $1
         ORDER BY u.email`,
        [orgId]
    );
    return result.rows as OrgMember[];
}

export async function getOrgTags(orgId: string): Promise<Tag[]> {
    const result = await query(
        `SELECT *
         FROM tags
         WHERE org_id = $1
         ORDER BY name`,
        [orgId]
    );
    return result.rows as Tag[];
}

async function syncTicketTags(ticketId: string, orgId: string, tagNames: string[]) {
    const cleaned = tagNames.map(t => t.trim().toLowerCase()).filter(Boolean);
    if (cleaned.length === 0) {
        await query('DELETE FROM ticket_tags WHERE ticket_id = $1', [ticketId]);
        return;
    }

    // Upsert all tags
    for (const name of cleaned) {
        await query(
            `INSERT INTO tags (org_id, name)
             VALUES ($1, $2) ON CONFLICT (org_id, name) DO NOTHING`,
            [orgId, name]
        );
    }

    // Fetch their IDs
    const placeholders = cleaned.map((_, i) => `$${i + 2}`).join(', ');
    const tagResult = await query(
        `SELECT id
         FROM tags
         WHERE org_id = $1
           AND name IN (${placeholders})`,
        [orgId, ...cleaned]
    );
    const tagIds: string[] = tagResult.rows.map((r: { id: string }) => r.id);

    // Replace ticket tags
    await query('DELETE FROM ticket_tags WHERE ticket_id = $1', [ticketId]);
    for (const tagId of tagIds) {
        await query(
            `INSERT INTO ticket_tags (ticket_id, tag_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [ticketId, tagId]
        );
    }
}