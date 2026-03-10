import {query} from './db';
import {Ticket} from '@/types/ticket';
import {TicketFilters, CursorPage, TicketPage, encodeCursor, decodeCursor} from '@/types/filters';

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

export async function searchTickets(
    orgId: string,
    filters: TicketFilters,
    page: CursorPage
): Promise<TicketPage> {
    const {search, status, severity, assignee_id, tag, date_from, date_to} = filters;
    const {cursor, limit} = page;
    const fetchLimit = limit + 1; // fetch one extra to detect hasMore

    const conditions: string[] = ['t.org_id = $1', 't.deleted_at IS NULL'];
    const values: unknown[] = [orgId];
    let idx = 2;

    // Full-text search
    if (search && search.trim()) {
        conditions.push(`t.search_vector @@ plainto_tsquery('english', $${idx++})`);
        values.push(search.trim());
    }

    // Status filter
    if (status) {
        conditions.push(`t.status = $${idx++}`);
        values.push(status);
    }

    // Severity filter
    if (severity) {
        conditions.push(`t.severity = $${idx++}`);
        values.push(severity);
    }

    // Assignee filter
    if (assignee_id) {
        conditions.push(`t.assignee_id = $${idx++}`);
        values.push(assignee_id);
    }

    // Tag filter — ticket must have this tag
    if (tag) {
        conditions.push(`EXISTS (
            SELECT 1 FROM ticket_tags tt2
            JOIN tags tg2 ON tg2.id = tt2.tag_id
            WHERE tt2.ticket_id = t.id AND tg2.name = $${idx++}
        )`);
        values.push(tag.toLowerCase());
    }

    // Date range filters
    if (date_from) {
        conditions.push(`t.created_at >= $${idx++}`);
        values.push(date_from);
    }
    if (date_to) {
        conditions.push(`t.created_at <= $${idx++}`);
        values.push(date_to);
    }

    // Cursor pagination — stable sort on (updated_at DESC, id DESC)
    if (cursor) {
        const decoded = decodeCursor(cursor);
        if (decoded) {
            conditions.push(
                `(t.updated_at, t.id) < ($${idx++}::timestamptz, $${idx++}::uuid)`
            );
            values.push(decoded.updatedAt, decoded.id);
        }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Get total count (without cursor for accurate count)
    const countConditions = conditions.filter(c => !c.includes('(t.updated_at, t.id) <'));
    const countValues = values.slice(0, countConditions.length === conditions.length ? values.length : values.length - 2);

    const countResult = await query(
        `SELECT COUNT(DISTINCT t.id) ::int AS total
         FROM tickets t
             ${countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : ''}`,
        countValues
    );
    const total = (countResult.rows[0] as { total: number }).total;

    // Main query with cursor pagination
    values.push(fetchLimit);
    const result = await query(
        `${TICKET_SELECT}
         ${where}
         GROUP BY t.id, u.email, a.email
         ORDER BY t.updated_at DESC, t.id DESC
         LIMIT $${idx}`,
        values
    );

    const rows = result.rows as Ticket[];
    const hasMore = rows.length > limit;
    const tickets = hasMore ? rows.slice(0, limit) : rows;

    const lastTicket = tickets[tickets.length - 1];
    const nextCursor = hasMore && lastTicket
        ? encodeCursor(lastTicket.updated_at, lastTicket.id)
        : null;

    return {tickets, nextCursor, hasMore, total};
}