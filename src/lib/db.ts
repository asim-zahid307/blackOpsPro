import {Pool, PoolClient, QueryResult} from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// These Postgres error codes are safe to ignore — object already exists
const IGNORABLE_PG_CODES = new Set([
    '42710', // duplicate_object (policy, type, etc already exists)
    '42P07', // duplicate_table
    '42701', // duplicate_column
    '23505', // unique_violation (duplicate index)
    '42P16', // invalid_table_definition (index already exists)
]);

let migrationPromise: Promise<void> | null = null;

async function applyMigrations(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations
            (
                filename
                VARCHAR
            (
                255
            ) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT NOW
            (
            )
                )
        `);

        const migrationsDir = path.join(process.cwd(), 'migrations');
        if (!fs.existsSync(migrationsDir)) return;

        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (!file.endsWith('.sql')) continue;

            const already = await client.query(
                'SELECT filename FROM schema_migrations WHERE filename = $1',
                [file]
            );
            if (already.rows.length > 0) {
                console.log(`↺ Already applied, skipping: ${file}`);
                continue;
            }

            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`✓ Migration applied: ${file}`);
            } catch (err: unknown) {
                await client.query('ROLLBACK');
                const pgErr = err as { code?: string; message?: string };

                if (pgErr.code && IGNORABLE_PG_CODES.has(pgErr.code)) {
                    // Object already exists — mark as applied and move on
                    console.log(`↺ Migration skipped (already exists): ${file}`);
                    await client.query(
                        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
                        [file]
                    );
                } else {
                    console.error(`✗ Migration failed: ${file} — ${pgErr.message ?? String(err)}`);
                    throw err;
                }
            }
        }
    } finally {
        client.release();
    }
}

export function ensureMigrations(): Promise<void> {
    if (!migrationPromise) {
        migrationPromise = applyMigrations().catch((err) => {
            migrationPromise = null;
            throw err;
        });
    }
    return migrationPromise;
}

ensureMigrations().catch(err => console.error('Migration startup error:', err));

export async function getClient(): Promise<PoolClient> {
    await ensureMigrations();
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

export async function queryAsUser(
    userId: string,
    text: string,
    params?: unknown[]
): Promise<QueryResult> {
    const client = await getClient();
    try {
        await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await query(text, params);
    return (result.rows[0] as T) ?? null;
}

export async function queryOneAsUser<T = unknown>(
    userId: string,
    text: string,
    params?: unknown[]
): Promise<T | null> {
    const result = await queryAsUser(userId, text, params);
    return (result.rows[0] as T) ?? null;
}

export default pool;