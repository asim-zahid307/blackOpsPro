import {Pool, PoolClient, QueryResult} from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Run migrations on startup (only once per process)
let migrationsDone = false;

export async function runMigrations() {
    if (migrationsDone) return;
    migrationsDone = true;

    try {
        const migrationsDir = path.join(process.cwd(), 'migrations');

        if (!fs.existsSync(migrationsDir)) return;

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
                } catch (err: unknown) {
                    // Already exists errors — safe to skip
                    const pgErr = err as { code?: string };
                    if (pgErr.code && ['42710', '42P07', '42701', '23505'].includes(pgErr.code)) {
                        console.log(`↺ Migration skipped (already exists): ${file}`);
                    } else {
                        throw err;
                    }
                }
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Migration error:', error);
    }
}

// Auto-run migrations when this module is first loaded
runMigrations();

export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

/**
 * Run a query without RLS context (for internal/admin operations only)
 */
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
    const client = await getClient();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

/**
 * Run a query WITH RLS context — sets app.current_user_id so Postgres
 * RLS policies can filter rows by the authenticated user.
 */
export async function queryAsUser(
    userId: string,
    text: string,
    params?: unknown[]
): Promise<QueryResult> {
    const client = await getClient();
    try {
        // Set the user context for RLS policies
        await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await query(text, params);
    return (result.rows[0] as T) || null;
}

export async function queryOneAsUser<T = unknown>(
    userId: string,
    text: string,
    params?: unknown[]
): Promise<T | null> {
    const result = await queryAsUser(userId, text, params);
    return (result.rows[0] as T) || null;
}

export default pool;