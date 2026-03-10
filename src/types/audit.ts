export type AuditAction =
    | 'ticket.created'
    | 'ticket.updated'
    | 'ticket.deleted'
    | 'ticket.status_changed'
    | 'ticket.assignee_changed'
    | 'ticket.severity_changed'
    | 'ticket.tags_changed'
    | 'comment.created'
    | 'org.member_invited'
    | 'org.member_removed'
    | 'org.role_changed';

export type AuditEntityType = 'ticket' | 'comment' | 'organization' | 'user';

export interface AuditLog {
    id: string;
    org_id: string;
    actor_id: string;
    actor_email: string;
    action: AuditAction;
    entity_type: AuditEntityType;
    entity_id: string | null;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    created_at: string;
}

export interface WriteAuditInput {
    orgId: string;
    actorId: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
}