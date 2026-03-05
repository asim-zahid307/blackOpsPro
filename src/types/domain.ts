export interface Org {
    id: string;
    name: string;
    created_at: string;
}

export interface DBUser {
    id: string;
    email: string;
    password_hash: string;
}

export interface DBUserInsert {
    id: string;
    email: string;
}
