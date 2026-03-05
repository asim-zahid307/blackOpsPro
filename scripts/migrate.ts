import * as dotenv from 'dotenv';
import {Pool} from 'pg';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// --------------------
// Fix __dirname in ESM
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// Load .env.local explicitly
// --------------------
dotenv.config({path: path.resolve(process.cwd(), '.env.local')});

// --------------------
// Ensure DATABASE_URL exists
// --------------------
if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

// --------------------
// Create PostgreSQL pool
// --------------------
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --------------------
// Run migrations
// --------------------
async function runMigrations() {
    const migrationsDir = path.join(__dirname, '../migrations');

    // Get all SQL files in order
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} migration(s)`);

    const client = await pool.connect();

    try {
        // Create migrations tracking table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations
            (
                id
                SERIAL
                PRIMARY
                KEY,
                filename
                VARCHAR
            (
                255
            ) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW
            (
            )
                );
        `);

        for (const file of files) {
            // Skip already applied migrations
            const {rows} = await client.query(
                'SELECT 1 FROM migrations WHERE filename = $1',
                [file]
            );

            if (rows.length > 0) {
                console.log(`Skipping already applied migration: ${file}`);
                continue;
            }

            // Read SQL file
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            // Run migration
            console.log(`Running migration: ${file}`);
            await client.query(sql);

            // Mark as applied
            await client.query(
                'INSERT INTO migrations (filename) VALUES ($1)',
                [file]
            );
        }

        console.log('✅ All migrations applied successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

// --------------------
// Start migrations
// --------------------
runMigrations();