import {Pool} from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({path: path.resolve(process.cwd(), '.env.local')});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const pool = new Pool({connectionString: DATABASE_URL});

async function runMigrations() {
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.sort(); // ensure 001, 002, 003 order

    for (const file of files) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        const client = await pool.connect();

        try {
            await client.query(sql);
            console.log(`✅ Migration succeeded: ${file}`);
        } catch (err) {
            console.error(`❌ Migration failed: ${file}`, err);
            client.release();
            process.exit(1);
        } finally {
            client.release();
        }
    }

    console.log("🎉 All migrations completed!");
    await pool.end();
}

runMigrations().catch(err => {
    console.error(err);
    process.exit(1);
});