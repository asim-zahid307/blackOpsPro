export interface Invite {
    id: string;
    org_id: string;
    org_name: string;
    invited_by: string;
    invited_by_email: string;
    email: string | null;
    role: string;
    token: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
}

export interface CreateInviteInput {
    email?: string;
    role: 'admin' | 'member' | 'viewer';
}