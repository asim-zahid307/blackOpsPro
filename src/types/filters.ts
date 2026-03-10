import {TicketStatus} from './ticket';

export interface TicketFilters {
    search?: string;
    status?: TicketStatus;
    severity?: number;
    assignee_id?: string;
    tag?: string;
    date_from?: string;
    date_to?: string;
}

export interface CursorPage {
    // Cursor encodes: updated_at + id of last seen row
    cursor?: string;
    limit: number;
}

export interface TicketPage {
    tickets: import('./ticket').Ticket[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
}

export function encodeCursor(updatedAt: string, id: string): string {
    return Buffer.from(JSON.stringify({updatedAt, id})).toString('base64');
}

export function decodeCursor(cursor: string): { updatedAt: string; id: string } | null {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as { updatedAt: string; id: string };
    } catch {
        return null;
    }
}