// src/lib/db.ts
import {Pool, PoolClient} from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

export async function query(text: string, params?: unknown[]) {
    const client = await getClient();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

export async function queryOne(text: string, params?: unknown[]) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

export default pool;