export type TicketEventType =
    | 'ticket_created'
    | 'status_changed'
    | 'assignee_changed'
    | 'tags_changed'
    | 'severity_changed'
    | 'comment_added';

export interface Comment {
    id: string;
    ticket_id: string;
    org_id: string;
    user_id: string;
    user_email: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface TicketEvent {
    id: string;
    ticket_id: string;
    org_id: string;
    actor_id: string;
    actor_email: string;
    event_type: TicketEventType;
    old_value: string | null;
    new_value: string | null;
    comment_id: string | null;
    comment_content: string | null;
    created_at: string;
}

// Unified timeline entry — either an event or a comment
export type TimelineEntry =
    | (TicketEvent & { kind: 'event' })
    | (Comment & { kind: 'comment' });