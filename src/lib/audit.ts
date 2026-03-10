import {query} from './db';
import {AuditLog, WriteAuditInput} from '@/types/audit';

/**
 * Write an audit log entry.
 * This is insert-only — no updates or deletes are ever performed.
 * Server-side only — never called from client components.
 */
export async function writeAudit(input: WriteAuditInput): Promise<void> {
    try {
        await query(
            `INSERT INTO audit_logs
                 (org_id, actor_id, action, entity_type, entity_id, old_data, new_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                input.orgId,
                input.actorId,
                input.action,
                input.entityType,
                input.entityId ?? null,
                input.oldData ? JSON.stringify(input.oldData) : null,
                input.newData ? JSON.stringify(input.newData) : null,
            ]
        );
    } catch (error) {
        // Audit failures must never crash the main operation — just log
        console.error('[audit] Failed to write audit log:', error);
    }
}

/**
 * Get audit logs for an org — filtered by role.
 * Only admins and owners can see full audit history.
 * Members see only their own actions.
 */
export async function getAuditLogs(
    orgId: string,
    actorId: string,
    role: string,
    limit = 50,
    offset = 0
): Promise<AuditLog[]> {
    const isPrivileged = role === 'admin' || role === 'owner';

    const result = await query(
        `SELECT al.*, u.email AS actor_email
         FROM audit_logs al
                  JOIN users u ON u.id = al.actor_id
         WHERE al.org_id = $1
             ${isPrivileged ? '' : 'AND al.actor_id = $4'}
         ORDER BY al.created_at DESC
             LIMIT $2
         OFFSET $3`,
        isPrivileged
            ? [orgId, limit, offset]
            : [orgId, limit, offset, actorId]
    );

    return result.rows as AuditLog[];
}

export async function getAuditLogsForTicket(
    ticketId: string,
    orgId: string
): Promise<AuditLog[]> {
    const result = await query(
        `SELECT al.*, u.email AS actor_email
         FROM audit_logs al
                  JOIN users u ON u.id = al.actor_id
         WHERE al.entity_id = $1
           AND al.org_id = $2
         ORDER BY al.created_at DESC`,
        [ticketId, orgId]
    );
    return result.rows as AuditLog[];
}