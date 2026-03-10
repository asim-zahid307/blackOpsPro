import {query} from './db';
import {Comment, TicketEvent, TicketEventType} from '@/types/timeline';

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getComments(ticketId: string, orgId: string): Promise<Comment[]> {
    const result = await query(
        `SELECT c.*, u.email AS user_email
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.ticket_id = $1 AND c.org_id = $2
         ORDER BY c.created_at ASC`,
        [ticketId, orgId]
    );
    return result.rows as Comment[];
}

export async function createComment(
    ticketId: string,
    orgId: string,
    userId: string,
    content: string
): Promise<Comment> {
    const result = await query(
        `INSERT INTO comments (ticket_id, org_id, user_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [ticketId, orgId, userId, content]
    );
    const comment = result.rows[0] as Comment;

    // Record timeline event for comment
    await recordEvent({
        ticketId,
        orgId,
        actorId: userId,
        eventType: 'comment_added',
        commentId: comment.id,
    });

    // Touch updated_at on ticket
    await query(
        `UPDATE tickets SET updated_at = NOW() WHERE id = $1`,
        [ticketId]
    );

    // Return with user email
    const full = await query(
        `SELECT c.*, u.email AS user_email
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.id = $1`,
        [comment.id]
    );
    return full.rows[0] as Comment;
}

// ─── Events ──────────────────────────────────────────────────────────────────

interface RecordEventInput {
    ticketId: string;
    orgId: string;
    actorId: string;
    eventType: TicketEventType;
    oldValue?: string;
    newValue?: string;
    commentId?: string;
}

export async function recordEvent(input: RecordEventInput): Promise<void> {
    await query(
        `INSERT INTO ticket_events
            (ticket_id, org_id, actor_id, event_type, old_value, new_value, comment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            input.ticketId,
            input.orgId,
            input.actorId,
            input.eventType,
            input.oldValue ?? null,
            input.newValue ?? null,
            input.commentId ?? null,
        ]
    );
}

export async function getTimeline(ticketId: string, orgId: string): Promise<TicketEvent[]> {
    const result = await query(
        `SELECT te.*,
                u.email   AS actor_email,
                c.content AS comment_content
         FROM ticket_events te
                  JOIN users u ON u.id = te.actor_id
                  LEFT JOIN comments c ON c.id = te.comment_id
         WHERE te.ticket_id = $1
           AND te.org_id = $2
         ORDER BY te.created_at ASC`,
        [ticketId, orgId]
    );
    return result.rows as TicketEvent[];
}