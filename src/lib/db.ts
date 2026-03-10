// src/lib/db.ts
import {Pool, PoolClient, QueryResult} from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Run migrations on startup
(async () => {
    try {
        const migrationsDir = path.join(process.cwd(), 'migrations');

        if (fs.existsSync(migrationsDir)) {
            const files = fs.readdirSync(migrationsDir).sort();

            const client = await pool.connect();

            try {
                for (const file of files) {
                    if (!file.endsWith('.sql')) continue;

                    const sqlPath = path.join(migrationsDir, file);
                    const sql = fs.readFileSync(sqlPath, 'utf-8');

                    try {
                        await client.query(sql);
                        console.log(`✓ Migration executed: ${file}`);
                    } catch (err: any) {
                        if (err.code === '42710' || err.code === '42P07') {
                            console.log(`↺ Migration skipped (already exists): ${file}`);
                        } else {
                            throw err;
                        }
                    }
                }
            } finally {
                client.release();
            }
        }
    } catch (error) {
        console.error('Migration error:', error);
    }
})();

export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
    const client = await getClient();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await query(text, params);
    return (result.rows[0] as T) || null;
}

export default pool;