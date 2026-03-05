#!/usr/bin/env node
const { Pool } = require('pg');

async function setupComplete() {
    console.log('\n✅ Database setup complete!\n');
    console.log('Tables created:');
    console.log('  ✓ users');
    console.log('  ✓ organizations');
    console.log('  ✓ Indexes created\n');
    console.log('🚀 Ready to start development:\n');
    console.log('   npm run dev\n');
    console.log('Then test at: http://localhost:3000/signup\n');
}

async function initializeDatabase() {
    // Get credentials from environment or use defaults
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;

    // First try to create database
    let dbPool = new Pool({
        user: dbUser,
        password: dbPassword,
        host: dbHost,
        port: dbPort,
        database: 'postgres',
        connectionTimeoutMillis: 5000,
    });

    let dbClient;
    try {
        console.log('📦 Checking/Creating blackopspro database...');
        dbClient = await dbPool.connect();

        const checkDb = await dbClient.query(
            `SELECT 1 FROM pg_database WHERE datname = 'blackopspro'`
        );

        if (checkDb.rowCount === 0) {
            await dbClient.query('CREATE DATABASE blackopspro;');
            console.log('✓ Database created');
        } else {
            console.log('✓ Database exists');
        }

        dbClient.release();
    } catch (error) {
        console.error('❌ Database operation failed:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n⚠️  PostgreSQL is not responding');
            console.error('   Make sure PostgreSQL 18 is running');
            console.error('   Connection: ' + dbHost + ':' + dbPort);
        }

        if (error.code === '28P01') {
            console.error('\n⚠️  Authentication failed');
            console.error('   Check DB_USER and DB_PASSWORD in environment');
        }

        process.exit(1);
    } finally {
        await dbPool.end();
    }

    // Now connect to the new database and create tables
    let appPool = new Pool({
        user: dbUser,
        password: dbPassword,
        host: dbHost,
        port: dbPort,
        database: 'blackopspro',
        connectionTimeoutMillis: 5000,
    });

    let appClient;
    try {
        console.log('📦 Creating tables...');
        appClient = await appPool.connect();

        await appClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('  ✓ users table');

        await appClient.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('  ✓ organizations table');

        await appClient.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
        await appClient.query(`CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);`);
        console.log('  ✓ indexes');

        appClient.release();
        await appPool.end();

        await setupComplete();
        process.exit(0);

    } catch (error) {
        console.error('❌ Table creation failed:', error.message);

        if (error.code === '28P01') {
            console.error('   Authentication error - check credentials');
        }

        if (error.code === '3D000') {
            console.error('   Database does not exist - ensure previous step completed');
        }

        process.exit(1);
    }
}

initializeDatabase();
