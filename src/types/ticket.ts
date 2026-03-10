export type TicketStatus = 'open' | 'investigating' | 'mitigated' | 'resolved';

export interface Tag {
    id: string;
    org_id: string;
    name: string;
}

export interface Ticket {
    id: string;
    org_id: string;
    title: string;
    description: string | null;
    severity: number;
    status: TicketStatus;
    assignee_id: string | null;
    assignee_email: string | null;
    created_by: string;
    created_by_email: string;
    created_at: string;
    updated_at: string;
    tags: Tag[];
}

export interface OrgMember {
    user_id: string;
    email: string;
    role: string;
}

export interface CreateTicketInput {
    title: string;
    description?: string;
    severity: number;
    assignee_id?: string;
    tags?: string[]; // tag names
}

export interface UpdateTicketInput {
    title?: string;
    description?: string;
    severity?: number;
    status?: TicketStatus;
    assignee_id?: string | null;
    tags?: string[];
}

// Allowed status transitions
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    open: ['investigating', 'resolved'],
    investigating: ['mitigated', 'resolved', 'open'],
    mitigated: ['resolved', 'investigating'],
    resolved: ['investigating'],
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    investigating: 'Investigating',
    mitigated: 'Mitigated',
    resolved: 'Resolved',
};

export const SEVERITY_LABELS: Record<number, string> = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Info',
};