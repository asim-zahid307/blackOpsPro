export interface Organization {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface UserOrganization {
    id?: string;
    user_id: string;
    org_id: string;
    role: string;
}

