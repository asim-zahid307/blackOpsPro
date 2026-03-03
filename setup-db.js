md #!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script helps you set up your PostgreSQL database with the required schema.
 *
 * Usage:
 *   node setup-db.js
 *
 * Make sure your DATABASE_URL is set in .env.local before running this script.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function setupDatabase() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL is not set in .env.local');
        console.error('Please set DATABASE_URL to your PostgreSQL connection string.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    try {
        console.log('🔄 Connecting to PostgreSQL database...');
        const client = await pool.connect();

        // Read migration file
        const migrationPath = path.join(__dirname, 'supabase/migrations/001_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration...');
        await client.query(migrationSQL);

        console.log('✅ Database setup completed successfully!');
        console.log('');
        console.log('Your database now has:');
        console.log('  - users table (for authentication)');
        console.log('  - organizations table (for user organizations)');
        console.log('');

        client.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Make sure PostgreSQL is running');
        console.error('2. Verify your DATABASE_URL is correct');
        console.error('3. Check that the database exists and you have permissions');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();

